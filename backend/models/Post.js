const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 500 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, maxlength: 1000, default: "" },
    mediaUrl: { type: String, default: null },
    mediaType: { type: String, enum: ["image", "video", null], default: null },
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
    isVerifiedPost: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true },
);

postSchema.index({ "location.ward": 1, createdAt: -1 });
postSchema.index({ "location.pincode": 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ type: 1, "location.ward": 1 });

postSchema.pre("save", function (next) {
  if (this.content) {
    const matches = this.content.match(/#(\w+)/g);
    if (matches)
      this.hashtags = [...new Set(matches.map((h) => h.toLowerCase()))];
  }
  next();
});

module.exports = mongoose.model("Post", postSchema);
