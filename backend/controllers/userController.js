const User = require("../models/User");
const Post = require("../models/Post");
const Notification = require("../models/Notification");

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

    res.json({
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
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const { uploadToCloudinary } = require("../config/cloudinary");

const updateProfile = async (req, res) => {
  try {
    const { name, bio, city, ward, pincode } = req.body;
    const update = {};
    if (name) update.name = name.trim();
    if (bio !== undefined) update.bio = bio;
    if (city || ward || pincode) {
      update.location = {
        city: city || req.user.location.city,
        ward: ward || req.user.location.ward,
        pincode: pincode || req.user.location.pincode,
      };
    }

    // Upload avatar to Cloudinary
    if (req.file) {
      try {
        const result = await uploadToCloudinary(
          req.file.path,
          req.file.mimetype,
        );
        update.avatar = result.secure_url;
        console.log("✅ Avatar uploaded:", result.secure_url);
      } catch (err) {
        console.error("❌ Avatar upload failed:", err.message);
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, update, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const followUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res
        .status(400)
        .json({ success: false, message: "Can't follow yourself" });
    const target = await User.findById(req.params.id);
    if (!target)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    const isFollowing = target.followers.includes(req.user._id);
    if (isFollowing) {
      await User.findByIdAndUpdate(req.params.id, {
        $pull: { followers: req.user._id },
      });
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { following: req.params.id },
      });
    } else {
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
    res.json({ success: true, isFollowing: !isFollowing });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

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
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true },
    );
    res.json({ success: true, notifications, unreadCount });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q)
      return res
        .status(400)
        .json({ success: false, message: "Query required" });
    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { "location.ward": req.user.location.ward },
      ],
      _id: { $ne: req.user._id },
    })
      .select("name avatar role location isVerified")
      .limit(20);
    res.json({ success: true, users });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const getLocalLeaders = async (req, res) => {
  try {
    const leaders = await User.find({
      role: { $in: ["mla", "parshad", "reporter", "opposition"] },
      "location.ward": req.user.location.ward,
    }).select("name avatar role bio isVerified followers postCount");
    res.json({ success: true, leaders });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
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
