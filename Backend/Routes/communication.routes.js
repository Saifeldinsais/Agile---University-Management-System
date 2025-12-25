/**
 * Communication Routes
 * API routes for Student-Staff Communication
 */

const express = require('express');
const router = express.Router();
const communicationController = require('../Controllers/communication.controller');

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

// Conversations
router.get('/conversations', authenticate, communicationController.getConversations);
router.post('/conversations', authenticate, communicationController.createConversation);
router.get('/conversations/:id/messages', authenticate, communicationController.getMessages);
router.post('/conversations/:id/messages', authenticate, communicationController.sendMessage);

// Unread count
router.get('/unread', authenticate, communicationController.getUnreadCount);

// Meeting Requests
router.get('/meetings', authenticate, communicationController.getMeetingRequests);
router.post('/meetings', authenticate, communicationController.createMeetingRequest);
router.put('/meetings/:id', authenticate, communicationController.updateMeetingRequest);
router.delete('/meetings/:id', authenticate, communicationController.cancelMeetingRequest);

// Academic Guidance
router.get('/guidance', authenticate, communicationController.getGuidance);
router.post('/guidance', authenticate, communicationController.createGuidance);
router.put('/guidance/:id/read', authenticate, communicationController.markGuidanceRead);

// Staff lookup
router.get('/staff', authenticate, communicationController.getAvailableStaff);

module.exports = router;
