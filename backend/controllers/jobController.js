const Job = require("../models/Job");

// @desc    Create a job posting
// @route   POST /api/jobs/create
// @access  Private
const createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      contactPhone,
      whatsapp,
      salary,
      address,
    } = req.body;
    const user = req.user;

    if (!title || !description || !contactPhone) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Title, description, and contact phone are required",
        });
    }

    const job = await Job.create({
      postedBy: user._id,
      title: title.trim(),
      description: description.trim(),
      category: category || "other",
      contactPhone,
      whatsapp: whatsapp || contactPhone,
      salary: salary || {},
      location: {
        ...user.location,
        address: address || "",
      },
    });

    await job.populate("postedBy", "name avatar role");

    res.status(201).json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get jobs (location-filtered)
// @route   GET /api/jobs
// @access  Private
const getJobs = async (req, res) => {
  try {
    const { ward, pincode, category, page = 1, limit = 10 } = req.query;
    const user = req.user;

    const targetWard = ward || user.location.ward;
    const targetPincode = pincode || user.location.pincode;

    const query = {
      isActive: true,
      $or: [
        { "location.ward": targetWard },
        { "location.pincode": targetPincode },
      ],
    };

    if (category) query.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("postedBy", "name avatar role"),
      Job.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasMore: skip + jobs.length < total,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Private
const getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      "postedBy",
      "name avatar role location",
    );
    if (!job)
      return res.status(404).json({ success: false, message: "Job not found" });

    // Increment applicant interest count
    await Job.findByIdAndUpdate(req.params.id, { $inc: { applicants: 1 } });

    res.status(200).json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job)
      return res.status(404).json({ success: false, message: "Job not found" });

    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    await job.deleteOne();
    res.status(200).json({ success: true, message: "Job deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle job active status
// @route   PATCH /api/jobs/:id/toggle
// @access  Private
const toggleJobStatus = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job)
      return res.status(404).json({ success: false, message: "Job not found" });

    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    job.isActive = !job.isActive;
    await job.save();

    res.status(200).json({ success: true, isActive: job.isActive });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createJob, getJobs, getJob, deleteJob, toggleJobStatus };
