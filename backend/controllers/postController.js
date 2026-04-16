const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");

// @desc    Create a post
// @route   POST /api/posts/create
// @access  Private
const createPost = async (req, res) => {
  try {
    const { content, type, hashtags } = req.body;
    const user = req.user;

    // Validate post type based on role
    if (
      type === "news" &&
      !["reporter", "mla", "parshad"].includes(user.role)
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Only reporters/MLA can post news" });
    }

    if (!content && !req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Post must have content or media" });
    }

    const postData = {
      user: user._id,
      content: content || "",
      type: type || "post",
      location: user.location,
      isVerifiedPost: ["reporter", "mla", "parshad"].includes(user.role),
    };

    if (req.file) {
      postData.mediaUrl = req.file.path;
      postData.mediaType = req.file.mimetype.startsWith("video/")
        ? "video"
        : "image";
      if (postData.mediaType === "video") postData.type = "reel";
    }

    const post = await Post.create(postData);
    await post.populate("user", "name avatar role location isVerified");

    // Update user post count
    await User.findByIdAndUpdate(user._id, { $inc: { postCount: 1 } });

    // Handle mentions notifications
    const mentionRegex = /@(\w+)/g;
    if (content) {
      const mentions = content.match(mentionRegex);
      if (mentions) {
        // In production, resolve usernames to IDs and send notifications
      }
    }

    res.status(201).json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get feed posts (location-filtered)
// @route   GET /api/posts
// @access  Private
const getFeed = async (req, res) => {
  try {
    const { ward, pincode, type, page = 1, limit = 10 } = req.query;
    const user = req.user;

    // Use user's ward if not specified
    const targetWard = ward || user.location.ward;
    const targetPincode = pincode || user.location.pincode;

    const query = {
      $or: [
        { "location.ward": targetWard },
        { "location.pincode": targetPincode },
      ],
    };

    if (type) query.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [posts, total] = await Promise.all([
      Post.find(query)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("user", "name avatar role location isVerified")
        .populate("comments.user", "name avatar role"),
      Post.countDocuments(query),
    ]);

    // Add isLiked flag for current user
    const postsWithLike = posts.map((post) => {
      const postObj = post.toObject();
      postObj.isLiked = post.likes.includes(user._id);
      postObj.likeCount = post.likes.length;
      postObj.commentCount = post.comments.length;
      return postObj;
    });

    res.status(200).json({
      success: true,
      posts: postsWithLike,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
        hasMore: skip + posts.length < total,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Private
const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", "name avatar role location isVerified")
      .populate("comments.user", "name avatar role")
      .populate("comments.replies.user", "name avatar");

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    // Increment views
    await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    const postObj = post.toObject();
    postObj.isLiked = post.likes.includes(req.user._id);
    postObj.likeCount = post.likes.length;

    res.status(200).json({ success: true, post: postObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Like / Unlike post
// @route   POST /api/posts/:id/like
// @access  Private
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    const userId = req.user._id;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      await Post.findByIdAndUpdate(req.params.id, { $pull: { likes: userId } });
    } else {
      await Post.findByIdAndUpdate(req.params.id, {
        $addToSet: { likes: userId },
      });

      // Send notification (if not own post)
      if (post.user.toString() !== userId.toString()) {
        await Notification.create({
          recipient: post.user,
          sender: userId,
          type: "like",
          post: post._id,
          message: `${req.user.name} liked your post`,
        });
      }
    }

    const updatedPost = await Post.findById(req.params.id);
    res.status(200).json({
      success: true,
      isLiked: !isLiked,
      likeCount: updatedPost.likes.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add comment
// @route   POST /api/posts/:id/comment
// @access  Private
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Comment text required" });
    }

    const post = await Post.findById(req.params.id);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    const comment = { user: req.user._id, text: text.trim() };
    post.comments.push(comment);
    await post.save();

    await post.populate("comments.user", "name avatar role");

    const newComment = post.comments[post.comments.length - 1];

    // Notify post owner
    if (post.user.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.user,
        sender: req.user._id,
        type: "comment",
        post: post._id,
        message: `${req.user.name} commented on your post`,
      });
    }

    res
      .status(201)
      .json({
        success: true,
        comment: newComment,
        commentCount: post.comments.length,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    if (post.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    await post.deleteOne();
    await User.findByIdAndUpdate(req.user._id, { $inc: { postCount: -1 } });

    res.status(200).json({ success: true, message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get trending posts in ward
// @route   GET /api/posts/trending
// @access  Private
const getTrending = async (req, res) => {
  try {
    const user = req.user;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

    const posts = await Post.aggregate([
      {
        $match: {
          "location.ward": user.location.ward,
          createdAt: { $gte: since },
        },
      },
      {
        $addFields: {
          score: {
            $add: [
              { $size: "$likes" },
              { $multiply: [{ $size: "$comments" }, 2] },
              "$views",
            ],
          },
        },
      },
      { $sort: { score: -1 } },
      { $limit: 10 },
    ]);

    await Post.populate(posts, {
      path: "user",
      select: "name avatar role isVerified",
    });

    res.status(200).json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get reels feed
// @route   GET /api/posts/reels
// @access  Private
const getReels = async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;
    const user = req.user;

    const posts = await Post.find({
      type: "reel",
      $or: [
        { "location.ward": user.location.ward },
        { "location.pincode": user.location.pincode },
      ],
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("user", "name avatar role isVerified");

    res.status(200).json({ success: true, reels: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPost,
  getFeed,
  getPost,
  likePost,
  addComment,
  deletePost,
  getTrending,
  getReels,
};
