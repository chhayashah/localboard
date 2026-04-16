const express = require("express");
const router = express.Router();
const {
  createJob,
  getJobs,
  getJob,
  deleteJob,
  toggleJobStatus,
} = require("../controllers/jobController");
const { protect } = require("../middleware/auth");

router.get("/", protect, getJobs);
router.post("/create", protect, createJob);
router.get("/:id", protect, getJob);
router.delete("/:id", protect, deleteJob);
router.patch("/:id/toggle", protect, toggleJobStatus);

module.exports = router;
