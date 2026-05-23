const jwt = require("jsonwebtoken");
const User = require("../models/User");
const OTP = require("../models/OTP");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });

const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone)
      return res
        .status(400)
        .json({ success: false, message: "Phone or email required" });

    const isEmail = phone.includes("@");
    if (!isEmail && !/^[6-9]\d{9}$/.test(phone))
      return res
        .status(400)
        .json({ success: false, message: "Valid Indian phone required" });

    await OTP.deleteMany({ phone });

    const otp =
      process.env.MOCK_OTP === "true"
        ? process.env.MOCK_OTP_CODE || "123456"
        : Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.create({ phone, otp });
    console.log(`📱 OTP for ${phone}: ${otp}`);

    if (isEmail && process.env.MOCK_OTP !== "true") {
      const { sendOTPEmail } = require("../utils/emailService");
      await sendOTPEmail(phone, otp);
    }

    res.json({
      success: true,
      message: "OTP sent",
      ...(process.env.MOCK_OTP === "true" && { otp }),
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp)
      return res
        .status(400)
        .json({ success: false, message: "Phone and OTP required" });

    const record = await OTP.findOne({ phone, otp });
    if (!record)
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    if (record.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: record._id });
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    await OTP.deleteOne({ _id: record._id });

    const existing = await User.findOne({ phone });
    if (existing) {
      const token = generateToken(existing._id);
      return res.json({
        success: true,
        isNewUser: false,
        token,
        user: existing,
      });
    }

    res.json({
      success: true,
      isNewUser: true,
      phone,
      message: "OTP verified. Complete profile.",
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const signup = async (req, res) => {
  try {
    console.log("Signup body:", req.body);

    const { phone, name, city, ward, pincode, role } = req.body;

    if (!phone || !name || !city || !ward || !pincode) {
      const missing = [];
      if (!phone) missing.push("phone");
      if (!name) missing.push("name");
      if (!city) missing.push("city");
      if (!ward) missing.push("ward");
      if (!pincode) missing.push("pincode");
      return res.status(400).json({
        success: false,
        message: `Missing: ${missing.join(", ")}`,
      });
    }

    if (await User.findOne({ phone })) {
      return res.status(400).json({
        success: false,
        message: "Account already exists. Please login.",
      });
    }

    const allowed = ["user", "reporter", "mla", "parshad", "opposition"];
    const user = await User.create({
      name: name.trim(),
      phone,
      location: {
        city: city.trim(),
        ward: ward.trim(),
        pincode: pincode.toString(),
      },
      role: allowed.includes(role) ? role : "user",
    });

    const token = generateToken(user._id);
    res.status(201).json({ success: true, token, user });
  } catch (e) {
    console.error("Signup error:", e.message);
    res.status(500).json({ success: false, message: e.message });
  }
};

const getMe = (req, res) => res.json({ success: true, user: req.user });

module.exports = { sendOTP, verifyOTP, signup, getMe };
