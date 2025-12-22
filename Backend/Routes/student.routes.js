const StudentControllers = require("../Controllers/student.controller");
const express = require("express");
const Router = express.Router();


Router.get("/viewCourses" , StudentControllers.viewCourses);
Router.get("/enrolled/:studentId" , StudentControllers.viewEnrolled);
Router.post("/enroll" , StudentControllers.enrollCourse);
Router.put("/dropCourse" , StudentControllers.dropCourse);

Router.get("/electives" , StudentControllers.verifyStudent, StudentControllers.getAvailableElectives);
Router.post("/selectElective" , StudentControllers.verifyStudent, StudentControllers.selectElective);
Router.get("/timetable" , StudentControllers.verifyStudent, StudentControllers.getTimetable);


module.exports = Router;