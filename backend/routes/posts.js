const express = require("express");
const router = express.Router();
const {
  createPost,
  getFeed,
  getPost,
  likePost,
  addComment,
  deletePost,
  getTrending,
  getReels,
} = require("../controllers/postController");
const { protect } = require("../middleware/auth");

// Try to use cloudinary upload, fallback to memory if not configured
let upload;
try {
  const { upload: cloudUpload } = require("../config/cloudinary");
  upload = cloudUpload;
} catch (e) {
  const multer = require("multer");
  upload = multer({ storage: multer.memoryStorage() });
}

router.get("/trending", protect, getTrending);
router.get("/reels", protect, getReels);
router.get("/", protect, getFeed);
router.get("/:id", protect, getPost);
router.post("/create", protect, upload.single("media"), createPost);
router.post("/:id/like", protect, likePost);
router.post("/:id/comment", protect, addComment);
router.delete("/:id", protect, deletePost);

module.exports = router;
