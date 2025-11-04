const StudentControllers = require("../Controllers/student.controller");
const express = require("express");
const Router = express.Router();



Router.post("/signup",StudentControllers.signup);



module.exports = Router;