const express = require('express');
const router = express.Router();
const doctorController = require("../Controllers/doctor.controller");


router.route('/classrooms').post(doctorController.bookClassroom); // DONE EAV MODEL

module.exports = router;
