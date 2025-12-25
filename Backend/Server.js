require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const studentRouter = require("./Routes/student.routes");
const adminRouter = require("./Routes/admin.routes");
const adminEnrollmentsRouter = require("./Routes/adminEnrollments.routes");
const adminStaffRouter = require("./Routes/adminStaff.routes");
const assignmentRouter = require("./Routes/assignment.routes");
const assignmentSubmissionRouter = require("./Routes/assignmentSubmission.routes");
const authRouter = require("./Routes/user.routes");
const doctorRouter = require("./Routes/doctor.routes");
const staffRouter = require("./Routes/staff.routes");
const advisorRouter = require("./Routes/advisor.routes");
const parentRouter = require("./Routes/parent.routes");
const communicationRouter = require("./Routes/communication.routes");

const app = express();
const server = http.createServer(app);

// Setup Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});

// Make io accessible to routes/controllers
app.set("io", io);

// Track online users
const onlineUsers = new Map();

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // User joins their personal room
  socket.on("join-user", (userId) => {
    socket.join(`user-${userId}`);
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} joined, socket: ${socket.id}`);

    // Broadcast user online status
    io.emit("user-status", { userId, status: "online" });
  });

  // Join room based on user type (admin, student, etc.)
  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  // Join conversation room
  socket.on("join-conversation", (conversationId) => {
    socket.join(`conversation-${conversationId}`);
    console.log(`Socket ${socket.id} joined conversation: ${conversationId}`);
  });

  // Leave conversation room
  socket.on("leave-conversation", (conversationId) => {
    socket.leave(`conversation-${conversationId}`);
  });

  // Typing indicator
  socket.on("typing", ({ conversationId, userId, userName }) => {
    socket.to(`conversation-${conversationId}`).emit("user-typing", {
      conversationId,
      userId,
      userName
    });
  });

  // Stop typing
  socket.on("stop-typing", ({ conversationId, userId }) => {
    socket.to(`conversation-${conversationId}`).emit("user-stop-typing", {
      conversationId,
      userId
    });
  });

  // Message delivered acknowledgment
  socket.on("message-delivered", ({ messageId, conversationId }) => {
    socket.to(`conversation-${conversationId}`).emit("message-status-update", {
      messageId,
      status: "delivered"
    });
  });

  // Message read acknowledgment
  socket.on("message-read", ({ messageId, conversationId }) => {
    socket.to(`conversation-${conversationId}`).emit("message-status-update", {
      messageId,
      status: "read"
    });
  });

  socket.on("disconnect", () => {
    // Find and remove user from online users
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        io.emit("user-status", { userId, status: "offline" });
        break;
      }
    }
    console.log("Client disconnected:", socket.id);
  });
});

const pool = require("./Db_config/DB");

(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("MySQL Connected");
  } catch (err) {
    console.log("MySQL Error", err);
  }
})();

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Add after your database connection in Server.js
const setupAttributes = async () => {
};
setupAttributes();

app.use("/api/auth", authRouter);
app.use("/api/student", studentRouter);
app.use("/api/admin", adminRouter);
app.use("/api/admin/enrollments", adminEnrollmentsRouter);
app.use("/api/admin/staff", adminStaffRouter);
app.use("/api/admin/assignments", assignmentRouter);
app.use("/api/assignmentsubmission", assignmentSubmissionRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/staff", staffRouter);
app.use("/api/advisor", advisorRouter);
app.use("/api/parent", parentRouter);
app.use("/api/communication", communicationRouter);

const Port = 5000;
server.listen(Port, () => {
  console.log(`UMS Server is Listening on port ${Port}`);
  console.log("Socket.io enabled for real-time updates");
});