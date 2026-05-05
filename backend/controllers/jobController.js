const Job = require("../models/Job");

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
    if (!title || !description || !contactPhone)
      return res
        .status(400)
        .json({
          success: false,
          message: "Title, description, contact required",
        });

    const job = await Job.create({
      postedBy: req.user._id,
      title: title.trim(),
      description: description.trim(),
      category: category || "other",
      contactPhone,
      whatsapp: whatsapp || contactPhone,
      salary: salary || {},
      location: { ...req.user.location, address: address || "" },
    });
    await job.populate("postedBy", "name avatar role");
    res.status(201).json({ success: true, job });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const getJobs = async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const user = req.user;
    const query = {
      isActive: true,
      $or: [
        { "location.ward": user.location.ward },
        { "location.pincode": user.location.pincode },
      ],
    };
    if (category && category !== "all") query.category = category;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [jobs, total] = await Promise.all([
      Job.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("postedBy", "name avatar role"),
      Job.countDocuments(query),
    ]);
    res.json({
      success: true,
      jobs,
      pagination: {
        page: parseInt(page),
        total,
        hasMore: skip + jobs.length < total,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      "postedBy",
      "name avatar role location",
    );
    if (!job)
      return res.status(404).json({ success: false, message: "Job not found" });
    await Job.findByIdAndUpdate(req.params.id, { $inc: { applicants: 1 } });
    res.json({ success: true, job });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job)
      return res.status(404).json({ success: false, message: "Job not found" });
    if (job.postedBy.toString() !== req.user._id.toString())
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    await job.deleteOne();
    res.json({ success: true, message: "Deleted" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const toggleJobStatus = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job)
      return res.status(404).json({ success: false, message: "Job not found" });
    if (job.postedBy.toString() !== req.user._id.toString())
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    job.isActive = !job.isActive;
    await job.save();
    res.json({ success: true, isActive: job.isActive });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = { createJob, getJobs, getJob, deleteJob, toggleJobStatus };
