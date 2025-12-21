require("dotenv").config();

const express = require("express");
const cors = require("cors");
//const connectDB = require("./Db_config/DB");
const studentRouter = require("./Routes/student.routes");
const adminRouter = require("./Routes/admin.routes");
const authRouter = require("./Routes/user.routes");
const doctorRouter = require("./Routes/doctor.routes");
const staffRouter = require("./Routes/staff.routes");
const advisorRouter = require("./Routes/advisor.routes");
const app = express();

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

// Add after your database connection in Server.js
const setupAttributes = async () => {
};
setupAttributes();
// connectDB(); 

app.use("/api/auth", authRouter);
app.use("/api/student", studentRouter);
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/staff", staffRouter);
app.use("/api/advisor", advisorRouter);


const Port = 5000;
app.listen(5000, () => {
  console.log(`UMS Server is Listening on port 5000`);
});