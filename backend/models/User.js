const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    phone: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: (v) =>
          /^[6-9]\d{9}$/.test(v) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: "Valid phone or email required",
      },
    },
    avatar: { type: String, default: null },
    bio: { type: String, maxlength: 160, default: "" },
    location: {
      city: { type: String, required: true, trim: true },
      ward: { type: String, required: true, trim: true },
      pincode: { type: String, required: true },
    },
    role: {
      type: String,
      enum: ["user", "reporter", "mla", "parshad", "opposition"],
      default: "user",
    },
    isVerified: { type: Boolean, default: false },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    postCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

userSchema.index({ "location.ward": 1, "location.pincode": 1 });

module.exports = mongoose.model("User", userSchema);
