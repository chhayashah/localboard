require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io for real-time
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Make io accessible to routes
app.set("io", io);

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🏙️ LocalBoard API - Apna Sheher, Apni Awaaz",
    version: "1.0.0",
    status: "running",
  });
});

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/jobs", require("./routes/jobs"));
app.use("/api/users", require("./routes/users"));

// Socket.io real-time events
const connectedUsers = new Map(); // userId -> socketId

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // User joins their ward room
  socket.on("join", ({ userId, ward }) => {
    connectedUsers.set(userId, socket.id);
    socket.join(`ward:${ward}`);
    socket.join(`user:${userId}`);
    console.log(`👤 User ${userId} joined ward:${ward}`);
  });

  // New post notification to ward
  socket.on("new_post", ({ ward, post }) => {
    socket.to(`ward:${ward}`).emit("post_created", post);
  });

  // Like notification
  socket.on("like_post", ({ recipientId, data }) => {
    const recipientSocket = connectedUsers.get(recipientId);
    if (recipientSocket) {
      io.to(`user:${recipientId}`).emit("notification", data);
    }
  });

  // Comment notification
  socket.on("comment_post", ({ recipientId, data }) => {
    io.to(`user:${recipientId}`).emit("notification", data);
  });

  // Typing indicator for comments
  socket.on("typing", ({ postId, userName }) => {
    socket.broadcast.emit("user_typing", { postId, userName });
  });

  socket.on("disconnect", () => {
    // Remove from connected users
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// Error handler (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 LocalBoard Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 API: http://localhost:${PORT}`);
  console.log(`🌍 Tagline: Apna Sheher. Apni Awaaz.\n`);
});

module.exports = { app, server, io };
