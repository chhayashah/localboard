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
const { upload } = require("../config/cloudinary");

router.use(protect);
router.get("/notifications", getNotifications);
router.get("/search", searchUsers);
router.get("/leaders", getLocalLeaders);
router.put("/update", upload.single("avatar"), updateProfile);
router.get("/:id", getUserProfile);
router.post("/:id/follow", followUser);

module.exports = router;
