const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/admin.controller');

// // router.post("/signupAdmin",adminController.signUp);   // used one time to create admin in database 
// router.post("/signinAdmin",adminController.signIn);



router.route('/classrooms')
  .post(adminController.createClassroom)
  .get(adminController.getClassrooms);

router.route('/classrooms/:id')
  .patch(adminController.updateClassroom)
  .delete(adminController.deleteClassroom);

module.exports = router;
