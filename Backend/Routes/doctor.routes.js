const express = require('express');
const router = express.Router();
const doctorController = require("../Controllers/doctor.controller");


router.route('/classrooms').post(doctorController.bookClassroom); // DONE EAV MODEL
router.route('/courses/:courseId/assignments').post(doctorController.uploadAssignment); 
module.exports = router;
