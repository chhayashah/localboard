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

router.use(protect);
router.get("/", getJobs);
router.post("/create", createJob);
router.get("/:id", getJob);
router.delete("/:id", deleteJob);
router.patch("/:id/toggle", toggleJobStatus);

module.exports = router;
