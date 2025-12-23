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
const authRouter = require("./Routes/user.routes");
const doctorRouter = require("./Routes/doctor.routes");
const staffRouter = require("./Routes/staff.routes");
const advisorRouter = require("./Routes/advisor.routes");

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

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Join room based on user type (admin, student, etc.)
  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  socket.on("disconnect", () => {
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
app.use("/api/doctor", doctorRouter);
app.use("/api/staff", staffRouter);
app.use("/api/advisor", advisorRouter);

const Port = 5000;
server.listen(Port, () => {
  console.log(`UMS Server is Listening on port ${Port}`);
  console.log("Socket.io enabled for real-time updates");
});