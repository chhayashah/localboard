const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    category: {
      type: String,
      enum: [
        "driver",
        "cook",
        "cleaner",
        "security",
        "delivery",
        "teaching",
        "medical",
        "retail",
        "construction",
        "tech",
        "other",
      ],
      default: "other",
    },
    salary: {
      amount: { type: Number },
      period: {
        type: String,
        enum: ["hourly", "daily", "monthly"],
        default: "monthly",
      },
      negotiable: { type: Boolean, default: true },
    },
    contactPhone: {
      type: String,
      required: [true, "Contact phone is required"],
      match: [/^[6-9]\d{9}$/, "Please enter a valid Indian phone number"],
    },
    whatsapp: {
      type: String,
      default: null,
    },
    location: {
      city: { type: String, required: true },
      ward: { type: String, required: true },
      pincode: { type: String, required: true },
      address: { type: String },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    applicants: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Index for location-based queries
jobSchema.index({ "location.ward": 1, isActive: 1, createdAt: -1 });
jobSchema.index({ "location.pincode": 1, isActive: 1 });
jobSchema.index({ category: 1, "location.ward": 1 });

module.exports = mongoose.model("Job", jobSchema);
