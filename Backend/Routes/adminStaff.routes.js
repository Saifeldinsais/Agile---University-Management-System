const express = require('express');
const router = express.Router();
const adminStaffController = require('../Controllers/adminStaff.controller');
// const { verifyToken, requireRole } = require('../Utils/authMiddleware');

// All routes require admin role
// Note: For development, you can comment out the middleware temporarily
// router.use(verifyToken, requireRole('admin'));

// ================= LOOKUP DATA =================
// GET departments for filter dropdown
router.get('/departments', adminStaffController.getDepartments);

// GET staff statistics
router.get('/stats', adminStaffController.getStats);

// ================= STAFF CRUD =================
// GET all staff with filters
// Query params: role, department, status, search
router.get('/', adminStaffController.getStaff);

// GET single staff by ID
router.get('/:id', adminStaffController.getStaffById);

// POST create new staff member
router.post('/', adminStaffController.createStaff);

// PATCH update staff member
router.patch('/:id', adminStaffController.updateStaff);

// PATCH toggle staff status (activate/deactivate)
router.patch('/:id/toggle-status', adminStaffController.toggleStaffStatus);

// DELETE staff member
router.delete('/:id', adminStaffController.deleteStaff);

module.exports = router;
