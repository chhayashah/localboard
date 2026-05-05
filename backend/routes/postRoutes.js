const express = require("express");
const router = express.Router();
const {
  createPost,
  getFeed,
  getPost,
  likePost,
  addComment,
  deletePost,
  getReels,
  getTrending,
} = require("../controllers/postController");
const { protect } = require("../middleware/auth");
const { upload } = require("../config/cloudinary");

router.use(protect);
router.get("/", getFeed);
router.get("/trending", getTrending);
router.get("/reels", getReels);
router.post("/create", upload.single("media"), createPost);
router.get("/:id", getPost);
router.post("/:id/like", likePost);
router.post("/:id/comment", addComment);
router.post("/:id/share", async (req, res) => {
  const Post = require("../models/Post");
  await Post.findByIdAndUpdate(req.params.id, { $inc: { shares: 1 } });
  res.json({ success: true });
});
router.delete("/:id", deletePost);

module.exports = router;
