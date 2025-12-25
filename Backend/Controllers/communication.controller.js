/**
 * Communication Controller
 * HTTP request handlers for Student-Staff Communication
 */

const communicationService = require('../Services/communication.service');

// Helper to get user type from the JWT payload
const getUserType = (user) => {
    // JWT uses 'role', but we need 'student' or 'staff' for our logic
    const role = user.role || user.userType || user.entity_type;
    if (role === 'student') return 'student';
    return 'staff'; // doctor, ta, advisor are all staff
};

const communicationController = {
    // =====================================================
    // Conversations
    // =====================================================

    /**
     * Get all conversations
     * GET /api/communication/conversations
     */
    async getConversations(req, res) {
        try {
            const userId = req.user.id;
            const userType = getUserType(req.user);

            console.log('[COMM] getConversations - userId:', userId, 'type:', userType);

            const conversations = await communicationService.getConversations(userId, userType);
            res.json({ success: true, data: conversations });
        } catch (error) {
            console.error('[COMM] getConversations error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Create a new conversation
     * POST /api/communication/conversations
     */
    async createConversation(req, res) {
        try {
            const { staffId, staffType, subject } = req.body;
            const studentId = req.user.id;

            console.log('[COMM] createConversation - studentId:', studentId, 'staffId:', staffId, 'staffType:', staffType);

            if (!staffId || !staffType) {
                return res.status(400).json({
                    success: false,
                    message: 'staffId and staffType are required'
                });
            }

            const conversation = await communicationService.createConversation(
                studentId, staffId, staffType, subject || 'New Conversation'
            );

            res.status(201).json({ success: true, data: conversation });
        } catch (error) {
            console.error('[COMM] createConversation error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Get messages in a conversation
     * GET /api/communication/conversations/:id/messages
     */
    async getMessages(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const userType = getUserType(req.user);

            console.log('[COMM] getMessages - convId:', id, 'userId:', userId);

            // Verify user has access to this conversation
            const conversation = await communicationService.getConversationById(id, userId, userType);
            if (!conversation) {
                return res.status(404).json({ success: false, message: 'Conversation not found' });
            }

            const messages = await communicationService.getMessages(id);

            // Mark messages as read
            await communicationService.markMessagesAsRead(id, userType);

            res.json({ success: true, data: messages, conversation });
        } catch (error) {
            console.error('[COMM] getMessages error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Send a message
     * POST /api/communication/conversations/:id/messages
     */
    async sendMessage(req, res) {
        try {
            const { id } = req.params;
            const { message } = req.body;
            const userId = req.user.id;
            const userType = getUserType(req.user);
            const senderType = userType === 'student' ? 'student' : 'staff';

            console.log('[COMM] sendMessage - convId:', id, 'userId:', userId, 'senderType:', senderType);

            if (!message || !message.trim()) {
                return res.status(400).json({ success: false, message: 'Message is required' });
            }

            // Verify access
            const conversation = await communicationService.getConversationById(id, userId, userType);
            if (!conversation) {
                return res.status(404).json({ success: false, message: 'Conversation not found' });
            }

            const result = await communicationService.sendMessage(id, userId, senderType, message);

            console.log('[COMM] sendMessage result:', result);

            // Emit socket event for real-time
            const io = req.app.get('io');
            if (io && result.message) {
                // Emit to conversation room
                io.to(`conversation-${id}`).emit('new-message', {
                    conversation_id: parseInt(id),
                    message: result.message
                });

                // Also notify the recipient user directly
                const recipientId = senderType === 'student' ? conversation.staff_id : conversation.student_id;
                io.to(`user-${recipientId}`).emit('message-notification', {
                    conversation_id: parseInt(id),
                    sender_id: userId,
                    sender_type: senderType,
                    preview: message.substring(0, 50)
                });
            }

            res.status(201).json({ success: true, data: result });
        } catch (error) {
            console.error('[COMM] sendMessage error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Get unread message count
     * GET /api/communication/unread
     */
    async getUnreadCount(req, res) {
        try {
            const userId = req.user.id;
            const userType = getUserType(req.user);

            const count = await communicationService.getUnreadCount(userId, userType);
            res.json({ success: true, data: { unread_count: count } });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // =====================================================
    // Meeting Requests
    // =====================================================

    /**
     * Get meeting requests
     * GET /api/communication/meetings
     */
    async getMeetingRequests(req, res) {
        try {
            const userId = req.user.id;
            const userType = getUserType(req.user);
            const { status } = req.query;

            const requests = await communicationService.getMeetingRequests(userId, userType, status);
            res.json({ success: true, data: requests });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Create a meeting request
     * POST /api/communication/meetings
     */
    async createMeetingRequest(req, res) {
        try {
            const studentId = req.user.id;
            const { staffId, staffType, purpose, proposed_date, proposed_time, duration_minutes } = req.body;

            if (!staffId || !staffType || !purpose || !proposed_date || !proposed_time) {
                return res.status(400).json({
                    success: false,
                    message: 'staffId, staffType, purpose, proposed_date, and proposed_time are required'
                });
            }

            const result = await communicationService.createMeetingRequest(
                studentId, staffId, staffType,
                { purpose, proposed_date, proposed_time, duration_minutes }
            );

            // Emit socket event
            const io = req.app.get('io');
            if (io) {
                io.to(`user-${staffId}`).emit('new-meeting-request', {
                    request_id: result.request_id,
                    student_id: studentId
                });
            }

            res.status(201).json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Update meeting request (staff)
     * PUT /api/communication/meetings/:id
     */
    async updateMeetingRequest(req, res) {
        try {
            const { id } = req.params;
            const staffId = req.user.id;
            const { status, staff_notes, location, rejection_reason } = req.body;

            if (!status) {
                return res.status(400).json({ success: false, message: 'Status is required' });
            }

            const result = await communicationService.updateMeetingRequest(
                id, staffId, { status, staff_notes, location, rejection_reason }
            );

            res.json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    },

    /**
     * Cancel meeting request (student)
     * DELETE /api/communication/meetings/:id
     */
    async cancelMeetingRequest(req, res) {
        try {
            const { id } = req.params;
            const studentId = req.user.id;

            const result = await communicationService.cancelMeetingRequest(id, studentId);
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    },

    // =====================================================
    // Academic Guidance
    // =====================================================

    /**
     * Get academic guidance
     * GET /api/communication/guidance
     */
    async getGuidance(req, res) {
        try {
            const userId = req.user.id;
            const userType = getUserType(req.user);

            let guidance;
            if (userType === 'student') {
                guidance = await communicationService.getGuidanceForStudent(userId);
            } else {
                guidance = await communicationService.getGuidanceByAdvisor(userId);
            }

            res.json({ success: true, data: guidance });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Create academic guidance (advisor only)
     * POST /api/communication/guidance
     */
    async createGuidance(req, res) {
        try {
            const advisorId = req.user.id;
            const { studentId, title, content, guidance_type, priority } = req.body;

            if (!studentId || !title || !content) {
                return res.status(400).json({
                    success: false,
                    message: 'studentId, title, and content are required'
                });
            }

            const result = await communicationService.createGuidance(
                advisorId, studentId, { title, content, guidance_type, priority }
            );

            res.status(201).json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Mark guidance as read
     * PUT /api/communication/guidance/:id/read
     */
    async markGuidanceRead(req, res) {
        try {
            const { id } = req.params;
            const studentId = req.user.id;

            const result = await communicationService.markGuidanceAsRead(id, studentId);
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // =====================================================
    // Staff Lookup
    // =====================================================

    /**
     * Get available staff for messaging
     * GET /api/communication/staff
     */
    async getAvailableStaff(req, res) {
        try {
            const userId = req.user.id;
            const { type } = req.query;

            const staff = await communicationService.getAvailableStaff(userId, type);
            res.json({ success: true, data: staff });
        } catch (error) {
            console.error('[COMM] getAvailableStaff error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = communicationController;
