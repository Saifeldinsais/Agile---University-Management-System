/**
 * Announcement Routes
 * API routes for centralized announcements
 */

const express = require('express');
const router = express.Router();
const announcementController = require('../Controllers/announcement.controller');

// JWT Middleware
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
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
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

// =====================================================
// All routes require authentication
// =====================================================

// Get unread count (must be before /:id route)
router.get('/unread/count', authenticate, announcementController.getUnreadCount);

// CRUD operations
router.get('/', authenticate, announcementController.getAnnouncements);
router.get('/:id', authenticate, announcementController.getAnnouncementById);
router.post('/', authenticate, announcementController.createAnnouncement);
router.put('/:id', authenticate, announcementController.updateAnnouncement);
router.delete('/:id', authenticate, announcementController.deleteAnnouncement);

// Read tracking
router.put('/:id/read', authenticate, announcementController.markAsRead);

// Pin & Archive
router.put('/:id/pin', authenticate, announcementController.togglePin);
router.put('/:id/archive', authenticate, announcementController.archiveAnnouncement);

module.exports = router;
