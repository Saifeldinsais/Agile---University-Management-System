/**
 * Announcement Controller
 * HTTP request handlers for announcements
 */

const announcementService = require('../Services/announcement.service');

// Helper to get user type from JWT
const getUserType = (user) => {
    const role = user.role || user.userType;
    return role;
};

const announcementController = {
    // =====================================================
    // CRUD Operations
    // =====================================================

    /**
     * Get announcements for current user
     * GET /api/announcements
     */
    async getAnnouncements(req, res) {
        try {
            const userId = req.user.id;
            const userType = getUserType(req.user);
            const { status, priority, limit } = req.query;

            let announcements;

            // Admin sees all, others see filtered
            if (userType === 'admin') {
                announcements = await announcementService.getAllAnnouncements({ status, limit });
            } else {
                announcements = await announcementService.getAnnouncements(userId, userType, { status, priority, limit });
            }

            res.json({ success: true, data: announcements });
        } catch (error) {
            console.error('[Announcement] getAnnouncements error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Get single announcement
     * GET /api/announcements/:id
     */
    async getAnnouncementById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const announcement = await announcementService.getAnnouncementById(id, userId);

            if (!announcement) {
                return res.status(404).json({ success: false, message: 'Announcement not found' });
            }

            res.json({ success: true, data: announcement });
        } catch (error) {
            console.error('[Announcement] getAnnouncementById error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Create announcement (Admin/Doctor only)
     * POST /api/announcements
     */
    async createAnnouncement(req, res) {
        try {
            const userId = req.user.id;
            const userType = getUserType(req.user);

            // Only admin and doctors can create announcements
            if (!['admin', 'doctor', 'ta', 'advisor'].includes(userType)) {
                return res.status(403).json({ success: false, message: 'Not authorized to create announcements' });
            }

            const { title, content, priority, target_audience, deadline, expires_at, is_pinned, targets } = req.body;

            if (!title || !content) {
                return res.status(400).json({ success: false, message: 'Title and content are required' });
            }

            const result = await announcementService.createAnnouncement({
                title, content, priority, target_audience, deadline, expires_at, is_pinned, targets
            }, userId);

            // Emit socket event for real-time notification
            const io = req.app.get('io');
            if (io) {
                // Broadcast to rooms based on target audience
                if (target_audience === 'all') {
                    io.emit('new-announcement', { announcement_id: result.announcement_id, title });
                } else if (target_audience === 'students') {
                    io.to('students').emit('new-announcement', { announcement_id: result.announcement_id, title });
                } else if (target_audience === 'parents') {
                    io.to('parents').emit('new-announcement', { announcement_id: result.announcement_id, title });
                } else if (target_audience === 'staff') {
                    io.to('staff').emit('new-announcement', { announcement_id: result.announcement_id, title });
                }
            }

            res.status(201).json({ success: true, data: result });
        } catch (error) {
            console.error('[Announcement] createAnnouncement error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Update announcement
     * PUT /api/announcements/:id
     */
    async updateAnnouncement(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const userType = getUserType(req.user);

            if (!['admin', 'doctor', 'ta', 'advisor'].includes(userType)) {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }

            const result = await announcementService.updateAnnouncement(id, req.body, userId);
            res.json({ success: true, data: result });
        } catch (error) {
            console.error('[Announcement] updateAnnouncement error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    },

    /**
     * Delete announcement
     * DELETE /api/announcements/:id
     */
    async deleteAnnouncement(req, res) {
        try {
            const { id } = req.params;
            const userType = getUserType(req.user);

            if (!['admin', 'doctor'].includes(userType)) {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }

            await announcementService.deleteAnnouncement(id);
            res.json({ success: true, message: 'Announcement deleted' });
        } catch (error) {
            console.error('[Announcement] deleteAnnouncement error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // =====================================================
    // Read Tracking
    // =====================================================

    /**
     * Mark announcement as read
     * PUT /api/announcements/:id/read
     */
    async markAsRead(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const userType = getUserType(req.user);

            await announcementService.markAsRead(id, userId, userType);
            res.json({ success: true });
        } catch (error) {
            console.error('[Announcement] markAsRead error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Get unread count
     * GET /api/announcements/unread/count
     */
    async getUnreadCount(req, res) {
        try {
            const userId = req.user.id;
            const userType = getUserType(req.user);

            const count = await announcementService.getUnreadCount(userId, userType);
            res.json({ success: true, data: { count } });
        } catch (error) {
            console.error('[Announcement] getUnreadCount error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // =====================================================
    // Pin Operations
    // =====================================================

    /**
     * Toggle pin status
     * PUT /api/announcements/:id/pin
     */
    async togglePin(req, res) {
        try {
            const { id } = req.params;
            const userType = getUserType(req.user);

            if (!['admin', 'doctor'].includes(userType)) {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }

            const result = await announcementService.togglePin(id);
            res.json({ success: true, data: result });
        } catch (error) {
            console.error('[Announcement] togglePin error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    },

    /**
     * Archive announcement
     * PUT /api/announcements/:id/archive
     */
    async archiveAnnouncement(req, res) {
        try {
            const { id } = req.params;
            const userType = getUserType(req.user);

            if (!['admin', 'doctor'].includes(userType)) {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }

            await announcementService.archiveAnnouncement(id);
            res.json({ success: true, message: 'Announcement archived' });
        } catch (error) {
            console.error('[Announcement] archiveAnnouncement error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = announcementController;
