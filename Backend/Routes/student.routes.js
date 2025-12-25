const StudentControllers = require("../Controllers/student.controller");
const express = require("express");
const Router = express.Router();
const { authenticateToken } = require("../Utils/authMiddleware");


// Router.post("/signup",StudentControllers.signUp);
// Router.post("/signin",StudentControllers.signIn);

Router.get("/profile/:studentId", StudentControllers.getStudentProfile);
Router.get("/viewCourses", StudentControllers.viewCourses);
Router.get("/enrolled/:studentId", StudentControllers.viewEnrolled);
Router.get("/completed-courses/:studentId", StudentControllers.getCompletedCoursesWithGrades);
Router.post("/enroll", StudentControllers.enrollCourse);
Router.put("/dropCourse", StudentControllers.dropCourse);
Router.put("/enrollment/final-grade", StudentControllers.updateEnrollmentWithFinalGrade);
Router.get("/courses/:courseId/assignments", StudentControllers.viewCourseAssignments);
Router.get("/staff/:staffId/office-hours", authenticateToken, StudentControllers.getStaffOfficeHours);
Router.post("/staff/:staffId/meeting-requests", authenticateToken, StudentControllers.createMeetingRequestForStaff);
Router.get("/meeting-requests", authenticateToken, StudentControllers.getMyMeetingRequests);
Router.get(
  "/courses/:courseId/instructors",
  authenticateToken,
  StudentControllers.getCourseInstructors
);

module.exports = Router;