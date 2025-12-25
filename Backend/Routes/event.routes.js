/**
 * Event Routes
 * API routes for events management
 */

const express = require('express');
const router = express.Router();
const eventController = require('../Controllers/event.controller');

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

// Categories
router.get('/categories', authenticate, eventController.getCategories);

// Calendar view
router.get('/calendar', authenticate, eventController.getCalendarEvents);

// Parent-specific routes for viewing children's events
router.get('/parent/children-events', authenticate, eventController.getChildrenEvents);
router.get('/parent/child/:childId/events', authenticate, eventController.getChildEvents);

// CRUD
router.get('/', authenticate, eventController.getEvents);
router.get('/:id', authenticate, eventController.getEventById);
router.get('/:id/stats', authenticate, eventController.getEventStats);
router.post('/', authenticate, eventController.createEvent);
router.put('/:id', authenticate, eventController.updateEvent);
router.delete('/:id', authenticate, eventController.deleteEvent);
router.put('/:id/cancel', authenticate, eventController.cancelEvent);

// RSVP
router.post('/:id/rsvp', authenticate, eventController.rsvpEvent);
router.get('/:id/rsvps', authenticate, eventController.getEventRsvps);

// Attendance
router.post('/:id/check-in', authenticate, eventController.checkInEvent);
router.post('/:id/check-out', authenticate, eventController.checkOutEvent);
router.get('/:id/attendance', authenticate, eventController.getEventAttendance);

module.exports = router;

