const StudentControllers = require("../Controllers/student.controller");
const express = require("express");
const Router = express.Router();


// Router.post("/signup",StudentControllers.signUp);
// Router.post("/signin",StudentControllers.signIn);

Router.get("/viewCourses" , StudentControllers.viewCourses);
Router.get("/enrolled/:studentId" , StudentControllers.viewEnrolled);
Router.post("/enroll" , StudentControllers.enrollCourse);
Router.put("/dropCourse" , StudentControllers.dropCourse);


module.exports = Router;