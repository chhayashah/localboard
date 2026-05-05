const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 1000 },
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
    contactPhone: { type: String, required: true, match: /^[6-9]\d{9}$/ },
    whatsapp: { type: String, default: null },
    location: {
      city: { type: String, required: true },
      ward: { type: String, required: true },
      pincode: { type: String, required: true },
      address: { type: String },
    },
    isActive: { type: Boolean, default: true },
    applicants: { type: Number, default: 0 },
  },
  { timestamps: true },
);

jobSchema.index({ "location.ward": 1, isActive: 1, createdAt: -1 });
jobSchema.index({ category: 1, "location.ward": 1 });

module.exports = mongoose.model("Job", jobSchema);
