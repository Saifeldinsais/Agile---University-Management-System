const StudentControllers = require("../Controllers/student.controller");
const express = require("express");
const Router = express.Router();



Router.post("/signup",StudentControllers.signUp);
Router.post("/signin",StudentControllers.signIn);



module.exports = Router;