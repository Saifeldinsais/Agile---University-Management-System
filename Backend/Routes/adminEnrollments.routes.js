const express = require('express');
const router = express.Router();
const adminEnrollmentsController = require('../Controllers/adminEnrollments.controller');
const { verifyToken, requireRole } = require('../Utils/authMiddleware');

// All routes require admin role
// Note: For development, you can comment out the middleware temporarily
// router.use(verifyToken, requireRole('admin'));

// ================= LOOKUP DATA =================
// GET departments for filter dropdown
router.get('/departments', adminEnrollmentsController.getDepartments);

// GET advisors (optionally filtered by department)
router.get('/advisors', adminEnrollmentsController.getAdvisors);

// ================= ENROLLMENTS CRUD =================
// GET all enrollments with filters
// Query params: status, department, search
router.get('/', adminEnrollmentsController.getEnrollments);

// GET single enrollment by ID
router.get('/:id', adminEnrollmentsController.getEnrollmentById);

// PATCH assign advisor to enrollment
router.patch('/:id/assign-advisor', adminEnrollmentsController.assignAdvisor);

// PATCH decide on enrollment (approve/reject)
router.patch('/:id/decide', adminEnrollmentsController.decideEnrollment);

module.exports = router;
