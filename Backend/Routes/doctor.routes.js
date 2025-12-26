const express = require('express');
const router = express.Router();
const { authenticateToken } = require("../Utils/authMiddleware");
const uploadAssignment = require("../Utils/uploadAssignments");
const uploadResource = require("../Utils/uploadResources"); // We'll create this
const doctorController = require("../Controllers/doctor.controller");


router.route('/classrooms').post(doctorController.bookClassroom); // DONE EAV MODEL
router.get("/courses/:doctorId", doctorController.getDoctorCourses);
router.post("/courses/:courseId/assignments", doctorController.createCourseAssignment);
router.get("/courses/:courseId/assignments", doctorController.getCourseAssignments);
router.put("/assignments/:assignmentId", doctorController.updateAssignment);
router.post(
  "/assignments/:assignmentId/attachments/upload",
  uploadAssignment.single("file"),
  doctorController.uploadAssignmentAttachment
);
router.get("/courses/:courseId/students", doctorController.getCourseStudents);

// ========== Course Resources Routes ==========
router.get("/courses/:courseId/resources", doctorController.getCourseResources);
router.post(
  "/courses/:courseId/resources/upload",
  uploadResource.single("file"),
  doctorController.uploadCourseResource
);

// ========== Course Staff Routes ==========
router.get("/courses/:courseId/staff", doctorController.getCourseStaff);

// ========== Course Schedule Routes ==========
router.get("/courses/:courseId/schedule/:doctorId", doctorController.getCourseSchedule);

// ========== Office Hours Routes ==========
router.get("/office-hours/me", authenticateToken, doctorController.getMyOfficeHours);
router.post("/office-hours", authenticateToken, doctorController.createOfficeHour);

router.get("/meeting-requests", authenticateToken, doctorController.getMeetingRequests);
router.put("/meeting-requests/:id/approve", authenticateToken, doctorController.approveMeetingRequest);
router.put("/meeting-requests/:id/reject", authenticateToken, doctorController.rejectMeetingRequest);


router.get("/by-email", doctorController.getDoctorByEmail);

router.put("/profile", authenticateToken, doctorController.updateMyDoctorProfile);

// ========== Student Grading Routes ==========
router.put("/enrollments/:enrollmentId/grade", authenticateToken, doctorController.updateStudentGrade);

module.exports = router;

