const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test connection on startup
cloudinary.api
  .ping()
  .then(() =>
    console.log("✅ Cloudinary connected:", process.env.CLOUDINARY_CLOUD_NAME),
  )
  .catch((e) => console.error("❌ Cloudinary error:", e.message));

// Use disk storage first, then upload to Cloudinary manually
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "/tmp/uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/mov",
      "video/avi",
      "video/quicktime",
      "video/webm",
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only images and videos allowed"), false);
  },
});

// Upload file to Cloudinary after multer saves it
const uploadToCloudinary = async (filePath, mimetype) => {
  const isVideo = mimetype.startsWith("video/");
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "localboard",
    resource_type: isVideo ? "video" : "image",
    transformation: isVideo
      ? [{ width: 1080, crop: "limit" }]
      : [{ width: 1080, crop: "limit", quality: "auto" }],
  });
  // Delete temp file
  fs.unlink(filePath, () => {});
  return result;
};

module.exports = { cloudinary, upload, uploadToCloudinary };
