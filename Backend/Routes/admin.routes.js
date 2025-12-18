const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/admin.controller');
const courseController = require("../Controllers/course.controller");
// router.post("/signupAdmin",adminController.signUp);   // used one time to create admin in database 


router.post("/classrooms/:roomId/timeslots", adminController.addTimeSlot); // DONE EAV MODEL
router.patch("/classrooms/:roomId/timeslots/:slotId", adminController.updateTimeSlot); // DONE EAV MODEL
router.delete("/classrooms/:roomId/timeslots/:slotId", adminController.deleteTimeSlot); // DONE EAV MODEL


router.route('/classrooms')
  .post(adminController.createClassroom)  // DONE EAV MODEL
  .get(adminController.getClassrooms);  // DONE EAV MODEL
 

router.route('/classrooms/:id')
  .patch(adminController.updateClassroom) // DONE EAV MODEL
  .delete(adminController.deleteClassroom); // DONE EAV MODEL

  router.route('/classrooms/:id/status')
.get(adminController.getClassroomStatus) // DONE EAV MODEL

//==================== courses =====================  

router.post("/courses", courseController.createCourse); // DONE EAV MODEL
router.get("/courses", courseController.getCourses); // DONE EAV MODEL
router.patch("/courses/:id", courseController.updateCourse);  // DONE EAV MODEL
router.delete("/courses/:id", courseController.deleteCourse); // DONE EAV MODEL

//==================== assigning functions ====================

router.route('/classroom/:id/assign')
.post(adminController.assignClassroom)
.delete(adminController.unassignClassroom)

router.route('/courses/:courseId/doctor')
.post(adminController.assignCourseToDoctor) // DONE EAV MODEL
.delete(adminController.unassignCourseFromDoctor) // DONE EAV MODEL


//==================== enrollment requests ====================
router.patch('/enrollments/:student/accept', adminController.acceptEnrollments); // DONE EAV MODEL
router.patch('/enrollments/:student/reject', adminController.rejectEnrollments); // DONE EAV MODEL

//==================== get students ====================
router.get('/students', adminController.getStudents); // DONE EAV MODEL





module.exports = router;