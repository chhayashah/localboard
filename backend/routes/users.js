const express = require("express");
const router = express.Router();
const {
  getUserProfile,
  updateProfile,
  followUser,
  getNotifications,
  searchUsers,
  getLocalLeaders,
} = require("../controllers/userController");
const { protect } = require("../middleware/auth");

let upload;
try {
  const { upload: cloudUpload } = require("../config/cloudinary");
  upload = cloudUpload;
} catch (e) {
  const multer = require("multer");
  upload = multer({ storage: multer.memoryStorage() });
}

router.get("/notifications", protect, getNotifications);
router.get("/search", protect, searchUsers);
router.get("/leaders", protect, getLocalLeaders);
router.get("/:id", protect, getUserProfile);
router.put("/update", protect, upload.single("avatar"), updateProfile);
router.post("/:id/follow", protect, followUser);

module.exports = router;
