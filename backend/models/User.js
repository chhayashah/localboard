const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      match: [/^[6-9]\d{9}$/, "Please enter a valid Indian phone number"],
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [160, "Bio cannot exceed 160 characters"],
      default: "",
    },
    location: {
      city: { type: String, required: true, trim: true },
      ward: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, match: /^\d{6}$/ },
    },
    role: {
      type: String,
      enum: ["user", "reporter", "mla", "parshad", "opposition"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    postCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Index for location-based queries
userSchema.index({ "location.ward": 1, "location.pincode": 1 });

module.exports = mongoose.model("User", userSchema);
