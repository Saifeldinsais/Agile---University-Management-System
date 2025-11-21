const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/admin.controller');

// router.post("/signupAdmin",adminController.signUp);   // used one time to create admin in database 
// router.post("/signinAdmin",adminController.signIn);

router.post("/classrooms/:roomId/timeslots", adminController.addTimeSlot);
router.patch("/classrooms/:roomId/timeslots/:slotId", adminController.updateTimeSlot);
router.delete("/classrooms/:roomId/timeslots/:slotId", adminController.deleteTimeSlot);


router.route('/classrooms')
  .post(adminController.createClassroom)
  .get(adminController.getClassrooms);
 

router.route('/classrooms/:id')
  .patch(adminController.updateClassroom)
  .delete(adminController.deleteClassroom);


  router.route('/classrooms/:id/status')
.get(adminController.getClassroomStatus)

//==================== courses =====================  


router
  .route("/courses")
  .post(adminController.createCourse)
  .get(adminController.getCourses);

router
  .route("/courses/:id")
  .delete(adminController.deleteCourse)
  .patch(adminController.updateCourse);

//==================== assigning functions ====================

router.route('/classroom/:id/assign')
.post(adminController.assignClassroom)
.delete(adminController.unassignClassroom)

router.route('/courses/:id/doctor')
.post(adminController.assignCourseToDoctor)
.delete(adminController.unassignCourseFromDoctor)





module.exports = router;
