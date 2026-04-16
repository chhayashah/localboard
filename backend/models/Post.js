const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 500 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    replies: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: { type: String, maxlength: 300 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      maxlength: [1000, "Post cannot exceed 1000 characters"],
      default: "",
    },
    mediaUrl: {
      type: String,
      default: null,
    },
    mediaType: {
      type: String,
      enum: ["image", "video", null],
      default: null,
    },
    type: {
      type: String,
      enum: ["post", "reel", "news", "update"],
      default: "post",
    },
    location: {
      city: { type: String, required: true },
      ward: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    hashtags: [{ type: String }],
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
    shares: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    isVerifiedPost: { type: Boolean, default: false }, // for reporter/mla posts
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Compound index for location-based feed queries
postSchema.index({ "location.ward": 1, createdAt: -1 });
postSchema.index({ "location.pincode": 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ type: 1, "location.ward": 1 });

// Extract hashtags and mentions from content before saving
postSchema.pre("save", function (next) {
  if (this.content) {
    // Extract hashtags
    const hashtagRegex = /#(\w+)/g;
    const matches = this.content.match(hashtagRegex);
    if (matches) {
      this.hashtags = [...new Set(matches.map((h) => h.toLowerCase()))];
    }
  }
  next();
});

module.exports = mongoose.model("Post", postSchema);
