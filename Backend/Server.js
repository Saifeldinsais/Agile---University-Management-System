require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./Db_config/DB");
const studentRouter = require("./Routes/student.routes");
const adminRouter = require("./Routes/admin.routes");
const authRouter = require("./Routes/user.routes");

const app = express();


app.use(cors({origin: "*"}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB(); 

app.use("/api/auth", authRouter);
app.use("/api/student", studentRouter);
app.use("/api/admin", adminRouter);


const Port = 5000;
app.listen(5000, () => {
  console.log(`UMS Server is Listening on port 5000`);
});