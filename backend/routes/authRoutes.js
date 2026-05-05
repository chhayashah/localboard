const express = require("express");
const router = express.Router();
const {
  sendOTP,
  verifyOTP,
  signup,
  getMe,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/signup", signup);
router.get("/me", protect, getMe);

module.exports = router;
