const jwt = require("jsonwebtoken");
const User = require("../models/User");
const OTP = require("../models/OTP");

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
};

// Generate 6-digit OTP
const generateOTP = () => {
  if (process.env.MOCK_OTP === "true") {
    return process.env.MOCK_OTP_CODE || "123456";
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Send OTP to phone
// @route   POST /api/auth/send-otp
// @access  Public
const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Valid Indian phone number required",
        });
    }

    // Delete existing OTPs for this phone
    await OTP.deleteMany({ phone });

    const otp = generateOTP();

    await OTP.create({ phone, otp });

    // In production, integrate SMS service like MSG91, Fast2SMS etc.
    // For now, we mock it
    console.log(`📱 OTP for ${phone}: ${otp}`);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      // ONLY in development/mock mode - remove in production
      ...(process.env.MOCK_OTP === "true" && { otp }),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP and signup/login
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Phone and OTP required" });
    }

    const otpRecord = await OTP.findOne({ phone, otp });

    if (!otpRecord) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    // Check if user exists
    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      // Login
      const token = generateToken(existingUser._id);
      return res.status(200).json({
        success: true,
        isNewUser: false,
        token,
        user: existingUser,
      });
    }

    // New user - phone verified, needs profile setup
    res.status(200).json({
      success: true,
      isNewUser: true,
      phone,
      message: "OTP verified. Please complete your profile.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Complete signup - create profile
// @route   POST /api/auth/signup
// @access  Public (after OTP verification)
const signup = async (req, res) => {
  try {
    const { phone, name, city, ward, pincode, role } = req.body;

    if (!phone || !name || !city || !ward || !pincode) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const allowedRoles = ["user", "reporter", "mla", "parshad", "opposition"];
    const userRole = allowedRoles.includes(role) ? role : "user";

    const user = await User.create({
      name: name.trim(),
      phone,
      location: { city: city.trim(), ward: ward.trim(), pincode },
      role: userRole,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};

module.exports = { sendOTP, verifyOTP, signup, getMe };
