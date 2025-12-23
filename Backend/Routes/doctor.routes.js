const express = require('express');
const router = express.Router();
const uploadAssignment = require("../Utils/uploadAssignments");
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

module.exports = router;
