const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

connectDB();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));
app.use("/api/jobs", require("./routes/jobRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", app: "LocalBoard" }),
);

app.use(errorHandler);

const wardRooms = new Map();

io.on("connection", (socket) => {
  const { userId, ward } = socket.handshake.query;
  console.log(`🔌 Connected: ${socket.id} | Ward: ${ward}`);

  if (ward) {
    socket.join(`ward:${ward}`);
    if (!wardRooms.has(ward)) wardRooms.set(ward, new Set());
    wardRooms.get(ward).add(socket.id);
    io.to(`ward:${ward}`).emit("ward_count", wardRooms.get(ward).size);
  }

  socket.on("new_post", (post) => {
    socket.to(`ward:${post.location?.ward}`).emit("post_created", post);
  });

  socket.on("disconnect", () => {
    if (ward && wardRooms.has(ward)) {
      wardRooms.get(ward).delete(socket.id);
      io.to(`ward:${ward}`).emit("ward_count", wardRooms.get(ward).size);
    }
  });
});

app.set("io", io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 LocalBoard running on port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}/api/health\n`);
});
