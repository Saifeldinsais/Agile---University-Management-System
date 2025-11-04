const connectDB = require("./Db_config/DB");
const express = require("express");
const studentRouter = require("./Routes/student.routes");
const cors = require("cors");
const app = express();
app.use(cors({origin: "*"}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
require("dotenv").config();
const Port = 5000;
connectDB(); 

app.use("/UMS",studentRouter)


app.listen(5000, () => {
  console.log(`UMS Server is Listening on port 5000`);
});