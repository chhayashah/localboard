const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");

const createPost = async (req, res) => {
  try {
    const { content, type } = req.body;
    const user = req.user;

    if (type === "news" && !["reporter", "mla", "parshad"].includes(user.role))
      return res
        .status(403)
        .json({ success: false, message: "Only reporters/MLA can post news" });

    if (!content && !req.file)
      return res
        .status(400)
        .json({ success: false, message: "Content or media required" });

    const data = {
      user: user._id,
      content: content || "",
      type: type || "post",
      location: user.location,
      isVerifiedPost: ["reporter", "mla", "parshad"].includes(user.role),
    };

    if (req.file && process.env.CLOUDINARY_CLOUD_NAME !== "dummy") {
      data.mediaUrl = req.file.path;
      data.mediaType = req.file.mimetype?.startsWith("video/")
        ? "video"
        : "image";
      if (data.mediaType === "video") data.type = "reel";
    }

    const post = await Post.create(data);
    await post.populate("user", "name avatar role location isVerified");
    await User.findByIdAndUpdate(user._id, { $inc: { postCount: 1 } });

    res.status(201).json({ success: true, post });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const getFeed = async (req, res) => {
  try {
    const { type, page = 1, limit = 10 } = req.query;
    const user = req.user;
    const query = {
      $or: [
        { "location.ward": user.location.ward },
        { "location.pincode": user.location.pincode },
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

    const result = posts.map((p) => {
      const obj = p.toObject();
      obj.isLiked = p.likes.includes(user._id);
      obj.likeCount = p.likes.length;
      obj.commentCount = p.comments.length;
      return obj;
    });

    res.json({
      success: true,
      posts: result,
      pagination: {
        page: parseInt(page),
        total,
        hasMore: skip + posts.length < total,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", "name avatar role location isVerified")
      .populate("comments.user", "name avatar role");
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    const obj = post.toObject();
    obj.isLiked = post.likes.includes(req.user._id);
    obj.likeCount = post.likes.length;
    res.json({ success: true, post: obj });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

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
    const updated = await Post.findById(req.params.id);
    res.json({
      success: true,
      isLiked: !isLiked,
      likeCount: updated.likes.length,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Comment required" });
    const post = await Post.findById(req.params.id);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    post.comments.push({ user: req.user._id, text: text.trim() });
    await post.save();
    await post.populate("comments.user", "name avatar role");
    const newComment = post.comments[post.comments.length - 1];
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
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    if (post.user.toString() !== req.user._id.toString())
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    await post.deleteOne();
    await User.findByIdAndUpdate(req.user._id, { $inc: { postCount: -1 } });
    res.json({ success: true, message: "Deleted" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

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
    res.json({ success: true, reels: posts });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const getTrending = async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const posts = await Post.aggregate([
      {
        $match: {
          "location.ward": req.user.location.ward,
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
    res.json({ success: true, posts });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = {
  createPost,
  getFeed,
  getPost,
  likePost,
  addComment,
  deletePost,
  getReels,
  getTrending,
};
