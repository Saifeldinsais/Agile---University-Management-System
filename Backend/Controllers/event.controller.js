/**
 * Event Controller
 * HTTP request handlers for events
 */

const eventService = require('../Services/event.service');

// Helper to get user type from JWT
const getUserType = (user) => {
    return user.role || user.userType || 'student';
};

const eventController = {
    // =====================================================
    // Categories
    // =====================================================

    async getCategories(req, res) {
        try {
            const categories = await eventService.getCategories();
            res.json({ success: true, data: categories });
        } catch (error) {
            console.error('[Event] getCategories error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // =====================================================
    // Event CRUD
    // =====================================================

    async getEvents(req, res) {
        try {
            const userId = req.user.id;
            const userType = getUserType(req.user);
            const { startDate, endDate, category_id, status, limit } = req.query;

            let events;
            if (userType === 'admin') {
                events = await eventService.getAllEvents({ startDate, endDate, category_id, status, limit });
            } else {
                events = await eventService.getEvents(userId, userType, { startDate, endDate, category_id, status, limit });
            }

            res.json({ success: true, data: events });
        } catch (error) {
            console.error('[Event] getEvents error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getCalendarEvents(req, res) {
        try {
            const userId = req.user.id;
            const userType = getUserType(req.user);
            const { year, month } = req.query;

            if (!year || !month) {
                return res.status(400).json({ success: false, message: 'Year and month are required' });
            }

            const events = await eventService.getCalendarEvents(userId, userType, parseInt(year), parseInt(month));
            res.json({ success: true, data: events });
        } catch (error) {
            console.error('[Event] getCalendarEvents error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getEventById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const event = await eventService.getEventById(id, userId);

            if (!event) {
                return res.status(404).json({ success: false, message: 'Event not found' });
            }

            res.json({ success: true, data: event });
        } catch (error) {
            console.error('[Event] getEventById error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async createEvent(req, res) {
        try {
            const userId = req.user.id;
            const userType = getUserType(req.user);

            if (!['admin', 'doctor', 'ta'].includes(userType)) {
                return res.status(403).json({ success: false, message: 'Not authorized to create events' });
            }

            const { title, start_datetime, end_datetime } = req.body;

            if (!title || !start_datetime || !end_datetime) {
                return res.status(400).json({ success: false, message: 'Title, start and end datetime are required' });
            }

            const result = await eventService.createEvent(req.body, userId);

            // Emit socket event for real-time notification
            const io = req.app.get('io');
            if (io) {
                io.emit('new-event', { event_id: result.event_id, title });
            }

            res.status(201).json({ success: true, data: result });
        } catch (error) {
            console.error('[Event] createEvent error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async updateEvent(req, res) {
        try {
            const { id } = req.params;
            const userType = getUserType(req.user);

            if (!['admin', 'doctor'].includes(userType)) {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }

            await eventService.updateEvent(id, req.body);
            res.json({ success: true });
        } catch (error) {
            console.error('[Event] updateEvent error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    },

    async deleteEvent(req, res) {
        try {
            const { id } = req.params;
            const userType = getUserType(req.user);

            if (userType !== 'admin') {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }

            await eventService.deleteEvent(id);
            res.json({ success: true, message: 'Event deleted' });
        } catch (error) {
            console.error('[Event] deleteEvent error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async cancelEvent(req, res) {
        try {
            const { id } = req.params;
            const userType = getUserType(req.user);

            if (!['admin', 'doctor'].includes(userType)) {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }

            await eventService.cancelEvent(id);
            res.json({ success: true, message: 'Event cancelled' });
        } catch (error) {
            console.error('[Event] cancelEvent error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // =====================================================
    // RSVP
    // =====================================================

    async rsvpEvent(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const userId = req.user.id;
            const userType = getUserType(req.user);

            if (!['going', 'interested', 'not_going'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Invalid RSVP status' });
            }

            const result = await eventService.rsvpEvent(id, userId, userType, status);
            res.json({ success: true, data: result });
        } catch (error) {
            console.error('[Event] rsvpEvent error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getEventRsvps(req, res) {
        try {
            const { id } = req.params;
            const rsvps = await eventService.getEventRsvps(id);
            res.json({ success: true, data: rsvps });
        } catch (error) {
            console.error('[Event] getEventRsvps error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // =====================================================
    // Attendance
    // =====================================================

    async checkInEvent(req, res) {
        try {
            const { id } = req.params;
            const { user_id } = req.body;
            const userType = getUserType(req.user);

            // Admin checks in users, or user checks themselves in
            const targetUserId = user_id || req.user.id;
            const targetUserType = user_id ? (req.body.user_type || 'student') : userType;

            await eventService.checkInEvent(id, targetUserId, targetUserType);
            res.json({ success: true, message: 'Checked in successfully' });
        } catch (error) {
            console.error('[Event] checkInEvent error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async checkOutEvent(req, res) {
        try {
            const { id } = req.params;
            const { user_id } = req.body;

            const targetUserId = user_id || req.user.id;

            await eventService.checkOutEvent(id, targetUserId);
            res.json({ success: true, message: 'Checked out successfully' });
        } catch (error) {
            console.error('[Event] checkOutEvent error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getEventAttendance(req, res) {
        try {
            const { id } = req.params;
            const attendance = await eventService.getEventAttendance(id);
            res.json({ success: true, data: attendance });
        } catch (error) {
            console.error('[Event] getEventAttendance error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getEventStats(req, res) {
        try {
            const { id } = req.params;
            const stats = await eventService.getEventStats(id);
            res.json({ success: true, data: stats });
        } catch (error) {
            console.error('[Event] getEventStats error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // =====================================================
    // Parent-Specific Endpoints
    // =====================================================

    /**
     * Get all events that a parent's children have RSVP'd to
     */
    async getChildrenEvents(req, res) {
        try {
            const userId = req.user.id;
            const userType = getUserType(req.user);

            if (userType !== 'parent') {
                return res.status(403).json({
                    success: false,
                    message: 'This endpoint is only for parents'
                });
            }

            const events = await eventService.getChildrenEvents(userId);
            res.json({ success: true, data: events });
        } catch (error) {
            console.error('[Event] getChildrenEvents error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Get events for a specific child
     */
    async getChildEvents(req, res) {
        try {
            const userId = req.user.id;
            const userType = getUserType(req.user);
            const { childId } = req.params;

            if (userType !== 'parent') {
                return res.status(403).json({
                    success: false,
                    message: 'This endpoint is only for parents'
                });
            }

            const events = await eventService.getChildEvents(userId, parseInt(childId));
            res.json({ success: true, data: events });
        } catch (error) {
            console.error('[Event] getChildEvents error:', error);
            if (error.message.includes('Access denied')) {
                res.status(403).json({ success: false, message: error.message });
            } else {
                res.status(500).json({ success: false, message: error.message });
            }
        }
    }
};

module.exports = eventController;

