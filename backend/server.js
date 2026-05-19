const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const server = http.createServer(app);

connectDB();

// ✅ CORS — sabse pehle, kuch bhi aane se pehle
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));
app.use("/api/jobs", require("./routes/jobRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", app: "LocalBoard" }),
);

app.use(errorHandler);

// Socket.io
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const wardRooms = new Map();
io.on("connection", (socket) => {
  const { ward } = socket.handshake.query;
  if (ward) {
    socket.join(`ward:${ward}`);
    if (!wardRooms.has(ward)) wardRooms.set(ward, new Set());
    wardRooms.get(ward).add(socket.id);
    io.to(`ward:${ward}`).emit("ward_count", wardRooms.get(ward).size);
  }
  socket.on("disconnect", () => {
    if (ward && wardRooms.has(ward)) {
      wardRooms.get(ward).delete(socket.id);
      io.to(`ward:${ward}`).emit("ward_count", wardRooms.get(ward).size);
    }
  });
});

app.set("io", io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 LocalBoard running on port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}/api/health\n`);
});
