const express = require('express');
const router = express.Router();
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

module.exports = router;

