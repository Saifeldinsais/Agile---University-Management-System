const express = require('express');
const router = express.Router();
const staffController = require('../Controllers/staff.controller');

// ================= STAFF DIRECTORY =================
// GET all staff (with optional ?type=professor or ?type=ta filter)
router.get('/', staffController.getAllStaff);

// GET staff by ID
router.get('/:id', staffController.getStaffById);

// CREATE new staff profile
router.post('/', staffController.createStaffProfile);

// UPDATE staff profile
router.patch('/:id', staffController.updateStaffProfile);

// DELETE staff profile
router.delete('/:id', staffController.deleteStaffProfile);

// ================= OFFICE HOURS =================
// GET office hours for a staff member
router.get('/:id/office-hours', staffController.getOfficeHours);

// UPDATE office hours for a staff member
router.patch('/:id/office-hours', staffController.updateOfficeHours);

// ================= COURSES =================
// GET assigned courses for a staff member
router.get('/:id/courses', staffController.getAssignedCourses);

// ASSIGN course to staff member
router.post('/:id/courses', staffController.assignCourse);

// ================= TA MANAGEMENT =================
// GET TA responsibilities
router.get('/ta/:id/responsibilities', staffController.getTAResponsibilities);

// UPDATE TA responsibilities
router.patch('/ta/:id/responsibilities', staffController.updateTAResponsibilities);

// ================= PERFORMANCE =================
// GET performance records
router.get('/:id/performance', staffController.getPerformanceRecords);

// ADD performance record
router.post('/:id/performance', staffController.addPerformanceRecord);

// GET research publications
router.get('/:id/research', staffController.getResearchPublications);

// ADD research publication
router.post('/:id/research', staffController.addResearchPublication);

// ================= HR / PAYROLL =================
// GET payroll info
router.get('/:id/payroll', staffController.getPayrollInfo);

// UPDATE payroll info (admin only)
router.patch('/:id/payroll', staffController.updatePayrollInfo);

// GET benefits
router.get('/:id/benefits', staffController.getBenefits);

// ================= LEAVE REQUESTS =================
// GET all leave requests (admin view, with optional ?status=pending filter)
router.get('/leave-requests/all', staffController.getAllLeaveRequests);

// GET leave requests for a specific staff member
router.get('/:id/leave-requests', staffController.getLeaveRequests);

// CREATE leave request
router.post('/:id/leave-requests', staffController.createLeaveRequest);

// UPDATE leave request status (approve/reject)
router.patch('/leave-requests/:requestId', staffController.updateLeaveRequestStatus);

// GET leave balance
router.get('/:id/leave-balance', staffController.getLeaveBalance);

// ================= PROFESSIONAL DEVELOPMENT =================
// GET professional development activities
router.get('/:id/professional-development', staffController.getProfessionalDevelopment);

// ADD professional development activity
router.post('/:id/professional-development', staffController.addProfessionalDevelopment);

// ================= USER-STAFF LINKING =================
// GET or CREATE staff profile by email (auto-creates if not exists)
router.post('/get-by-email', staffController.getOrCreateByEmail);

module.exports = router;

