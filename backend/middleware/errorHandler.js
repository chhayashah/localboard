const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV === "development") console.error("❌", err);

  if (err.name === "CastError")
    return res.status(404).json({ success: false, message: "Not found" });

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res
      .status(400)
      .json({ success: false, message: `${field} already exists` });
  }

  if (err.name === "ValidationError") {
    const msg = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    return res.status(400).json({ success: false, message: msg });
  }

  if (err.name === "JsonWebTokenError")
    return res.status(401).json({ success: false, message: "Invalid token" });

  if (err.code === "LIMIT_FILE_SIZE")
    return res
      .status(400)
      .json({ success: false, message: "File too large. Max 50MB" });

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Server Error",
  });
};

module.exports = errorHandler;
