const express = require('express');
const router = express.Router();
const assignmentController = require('../Controllers/assignment.controller');
// const { verifyToken, requireRole } = require('../Utils/authMiddleware');

// All routes require admin role
// Note: For development, you can comment out the middleware temporarily
// router.use(verifyToken, requireRole('admin'));

// ================= ASSIGNMENT CRUD =================

// POST assign staff to course
router.post('/', assignmentController.assignStaffToCourse);

// GET all assignments with optional filters
// Query params: courseId, staffId, role, status
router.get('/', assignmentController.getAllAssignments);

// GET assignments by course
router.get('/course/:courseId', assignmentController.getAssignmentsByCourse);

// GET assignments by staff member
router.get('/staff/:staffId', assignmentController.getAssignmentsByStaff);

// GET single assignment by ID
router.get('/:assignmentId', assignmentController.getAssignmentById);

// PATCH update assignment
router.patch('/:assignmentId', assignmentController.updateAssignment);

// DELETE remove assignment
router.delete('/:assignmentId', assignmentController.removeAssignment);

module.exports = router;
