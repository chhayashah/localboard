const User = require("../models/User");
const Post = require("../models/Post");
const Notification = require("../models/Notification");

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-__v")
      .populate("followers", "name avatar role")
      .populate("following", "name avatar role");

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(12)
      .select("mediaUrl type content likes comments createdAt");

    const isFollowing = user.followers.some(
      (f) => f._id.toString() === req.user._id.toString(),
    );

    res.status(200).json({
      success: true,
      user,
      posts,
      isFollowing,
      stats: {
        posts: user.postCount,
        followers: user.followers.length,
        following: user.following.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/update
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, bio, city, ward, pincode } = req.body;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (bio !== undefined) updateData.bio = bio;
    if (city || ward || pincode) {
      updateData.location = {
        city: city || req.user.location.city,
        ward: ward || req.user.location.ward,
        pincode: pincode || req.user.location.pincode,
      };
    }
    if (req.file) {
      updateData.avatar = req.file.path;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Follow / Unfollow user
// @route   POST /api/users/:id/follow
// @access  Private
const followUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res
        .status(400)
        .json({ success: false, message: "Can't follow yourself" });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const isFollowing = targetUser.followers.includes(req.user._id);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(req.params.id, {
        $pull: { followers: req.user._id },
      });
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { following: req.params.id },
      });
    } else {
      // Follow
      await User.findByIdAndUpdate(req.params.id, {
        $addToSet: { followers: req.user._id },
      });
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { following: req.params.id },
      });

      await Notification.create({
        recipient: req.params.id,
        sender: req.user._id,
        type: "follow",
        message: `${req.user.name} started following you`,
      });
    }

    res.status(200).json({ success: true, isFollowing: !isFollowing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get notifications
// @route   GET /api/users/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("sender", "name avatar role")
      .populate("post", "content mediaUrl type");

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    // Mark all as read
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true },
    );

    res.status(200).json({ success: true, notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search users in same ward
// @route   GET /api/users/search
// @access  Private
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q)
      return res
        .status(400)
        .json({ success: false, message: "Search query required" });

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { "location.ward": req.user.location.ward },
      ],
      _id: { $ne: req.user._id },
    })
      .select("name avatar role location isVerified")
      .limit(20);

    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get local leaders (MLA/Parshad in same area)
// @route   GET /api/users/leaders
// @access  Private
const getLocalLeaders = async (req, res) => {
  try {
    const leaders = await User.find({
      role: { $in: ["mla", "parshad", "reporter"] },
      "location.ward": req.user.location.ward,
    }).select("name avatar role bio isVerified followers postCount");

    res.status(200).json({ success: true, leaders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  followUser,
  getNotifications,
  searchUsers,
  getLocalLeaders,
};
