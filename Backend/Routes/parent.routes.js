/**
 * Parent Routes
 * API routes for the Parent-Teacher Portal
 */

const express = require('express');
const router = express.Router();
const parentController = require('../Controllers/parent.controller');

// JWT Middleware for protected routes
const jwt = require('jsonwebtoken');

const authenticateParent = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'No token provided'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        // Verify this is a parent token - check both entity_type and role
        const userRole = decoded.entity_type || decoded.role;
        if (userRole !== 'parent') {
            console.log('[Parent Routes] Access denied. User role:', userRole, 'Token:', decoded);
            return res.status(403).json({
                success: false,
                message: `Access denied. Parent role required. Your role: ${userRole}`
            });
        }

        // Normalize the user object
        req.user = {
            id: decoded.entity_id || decoded.id,
            entity_id: decoded.entity_id || decoded.id,
            entity_type: 'parent',
            role: 'parent',
            email: decoded.email
        };
        next();
    } catch (error) {
        console.error('[Parent Routes] Token error:', error.message);
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

// =====================================================
// Public Routes (No authentication required)
// =====================================================
router.post('/register', parentController.register);
router.post('/login', parentController.login);

// =====================================================
// Protected Routes (Authentication required)
// =====================================================

// Profile
router.get('/profile', authenticateParent, parentController.getProfile);
router.put('/profile', authenticateParent, parentController.updateProfile);

// Dashboard
router.get('/dashboard', authenticateParent, parentController.getDashboard);

// Students
router.get('/students', authenticateParent, parentController.getStudents);
router.post('/request-link', authenticateParent, parentController.requestLink);
router.get('/students/:studentId/progress', authenticateParent, parentController.getStudentProgress);
router.get('/students/:studentId/attendance', authenticateParent, parentController.getStudentAttendance);
router.get('/students/:studentId/remarks', authenticateParent, parentController.getStudentRemarks);

// Teachers
router.get('/teachers', authenticateParent, parentController.getAvailableTeachers);

// Messages
router.get('/messages', authenticateParent, parentController.getMessageThreads);
router.get('/messages/:teacherId', authenticateParent, parentController.getMessages);
router.post('/messages/:teacherId', authenticateParent, parentController.sendMessage);

// Announcements
router.get('/announcements', authenticateParent, parentController.getAnnouncements);
router.put('/announcements/:announcementId/read', authenticateParent, parentController.markAnnouncementRead);

module.exports = router;
