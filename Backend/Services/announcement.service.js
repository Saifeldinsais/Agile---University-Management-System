/**
 * Announcement Service
 * Business logic for centralized announcements system
 */

const pool = require('../Db_config/DB');

const announcementService = {
    // =====================================================
    // Create & Update
    // =====================================================

    /**
     * Create a new announcement
     */
    async createAnnouncement(data, creatorId) {
        const { title, content, priority, target_audience, deadline, expires_at, is_pinned, targets } = data;

        const [result] = await pool.query(
            `INSERT INTO announcement (title, content, priority, target_audience, deadline, expires_at, is_pinned, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, content, priority || 'normal', target_audience || 'all', deadline || null, expires_at || null, is_pinned || false, creatorId]
        );

        const announcementId = result.insertId;

        // Add custom targets if provided
        if (targets && targets.length > 0 && target_audience === 'custom') {
            for (const target of targets) {
                await pool.query(
                    `INSERT INTO announcement_target (announcement_id, target_type, target_id, target_value)
                     VALUES (?, ?, ?, ?)`,
                    [announcementId, target.type, target.id || null, target.value || null]
                );
            }
        }

        return { announcement_id: announcementId, success: true };
    },

    /**
     * Update an announcement
     */
    async updateAnnouncement(announcementId, data, userId) {
        const { title, content, priority, target_audience, deadline, expires_at, is_pinned, status } = data;

        // Verify announcement exists
        const [announcement] = await pool.query(
            'SELECT * FROM announcement WHERE announcement_id = ?',
            [announcementId]
        );

        if (!announcement[0]) {
            throw new Error('Announcement not found');
        }

        // Convert empty strings to null for datetime fields
        const deadlineValue = deadline && deadline.trim() !== '' ? deadline : null;
        const expiresAtValue = expires_at && expires_at.trim() !== '' ? expires_at : null;

        await pool.query(
            `UPDATE announcement SET 
                title = COALESCE(?, title),
                content = COALESCE(?, content),
                priority = COALESCE(?, priority),
                target_audience = COALESCE(?, target_audience),
                deadline = ?,
                expires_at = ?,
                is_pinned = COALESCE(?, is_pinned),
                status = COALESCE(?, status)
             WHERE announcement_id = ?`,
            [title, content, priority, target_audience, deadlineValue, expiresAtValue, is_pinned, status, announcementId]
        );

        return { success: true };
    },

    /**
     * Delete an announcement
     */
    async deleteAnnouncement(announcementId) {
        await pool.query('DELETE FROM announcement WHERE announcement_id = ?', [announcementId]);
        return { success: true };
    },

    /**
     * Archive an announcement
     */
    async archiveAnnouncement(announcementId) {
        await pool.query(
            `UPDATE announcement SET status = 'archived' WHERE announcement_id = ?`,
            [announcementId]
        );
        return { success: true };
    },

    // =====================================================
    // Read Operations
    // =====================================================

    /**
     * Get announcements for a user based on their role
     */
    async getAnnouncements(userId, userType, filters = {}) {
        const { status, priority, limit, includeRead } = filters;

        // Map user type to target audience
        const audienceMap = {
            'student': ['all', 'students'],
            'parent': ['all', 'parents'],
            'doctor': ['all', 'staff'],
            'ta': ['all', 'staff'],
            'advisor': ['all', 'staff'],
            'admin': ['all', 'students', 'parents', 'staff', 'custom']
        };

        const audiences = audienceMap[userType] || ['all'];
        const placeholders = audiences.map(() => '?').join(', ');

        let query = `
            SELECT 
                a.*,
                e.entity_name as creator_name,
                CASE WHEN ar.id IS NOT NULL THEN TRUE ELSE FALSE END as is_read,
                ar.read_at
            FROM announcement a
            LEFT JOIN entities e ON a.created_by = e.entity_id
            LEFT JOIN announcement_read ar ON a.announcement_id = ar.announcement_id AND ar.user_id = ?
            WHERE a.status = 'published'
            AND (a.expires_at IS NULL OR a.expires_at > NOW())
            AND a.target_audience IN (${placeholders})
        `;

        const params = [userId, ...audiences];

        if (priority) {
            query += ' AND a.priority = ?';
            params.push(priority);
        }

        if (!includeRead) {
            // Optionally filter to only show unread
        }

        query += ' ORDER BY a.is_pinned DESC, a.created_at DESC';

        if (limit) {
            query += ' LIMIT ?';
            params.push(parseInt(limit));
        }

        const [announcements] = await pool.query(query, params);
        return announcements;
    },

    /**
     * Get all announcements for admin
     */
    async getAllAnnouncements(filters = {}) {
        const { status, limit } = filters;

        let query = `
            SELECT 
                a.*,
                e.entity_name as creator_name,
                (SELECT COUNT(*) FROM announcement_read ar WHERE ar.announcement_id = a.announcement_id) as read_count
            FROM announcement a
            LEFT JOIN entities e ON a.created_by = e.entity_id
            WHERE 1=1
        `;

        const params = [];

        if (status) {
            query += ' AND a.status = ?';
            params.push(status);
        }

        query += ' ORDER BY a.created_at DESC';

        if (limit) {
            query += ' LIMIT ?';
            params.push(parseInt(limit));
        }

        const [announcements] = await pool.query(query, params);
        return announcements;
    },

    /**
     * Get single announcement by ID
     */
    async getAnnouncementById(announcementId, userId) {
        const [announcements] = await pool.query(`
            SELECT 
                a.*,
                e.entity_name as creator_name,
                CASE WHEN ar.id IS NOT NULL THEN TRUE ELSE FALSE END as is_read
            FROM announcement a
            LEFT JOIN entities e ON a.created_by = e.entity_id
            LEFT JOIN announcement_read ar ON a.announcement_id = ar.announcement_id AND ar.user_id = ?
            WHERE a.announcement_id = ?
        `, [userId, announcementId]);

        return announcements[0] || null;
    },

    // =====================================================
    // Read Tracking
    // =====================================================

    /**
     * Mark announcement as read
     */
    async markAsRead(announcementId, userId, userType) {
        await pool.query(
            `INSERT INTO announcement_read (announcement_id, user_id, user_type)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE read_at = NOW()`,
            [announcementId, userId, userType]
        );
        return { success: true };
    },

    /**
     * Get unread count for a user
     */
    async getUnreadCount(userId, userType) {
        const audienceMap = {
            'student': ['all', 'students'],
            'parent': ['all', 'parents'],
            'doctor': ['all', 'staff'],
            'ta': ['all', 'staff'],
            'advisor': ['all', 'staff'],
            'admin': ['all', 'students', 'parents', 'staff', 'custom']
        };

        const audiences = audienceMap[userType] || ['all'];
        const placeholders = audiences.map(() => '?').join(', ');

        const [result] = await pool.query(`
            SELECT COUNT(*) as count
            FROM announcement a
            LEFT JOIN announcement_read ar ON a.announcement_id = ar.announcement_id AND ar.user_id = ?
            WHERE a.status = 'published'
            AND (a.expires_at IS NULL OR a.expires_at > NOW())
            AND a.target_audience IN (${placeholders})
            AND ar.id IS NULL
        `, [userId, ...audiences]);

        return result[0].count;
    },

    // =====================================================
    // Pin Operations
    // =====================================================

    /**
     * Toggle pin status
     */
    async togglePin(announcementId) {
        const [announcement] = await pool.query(
            'SELECT is_pinned FROM announcement WHERE announcement_id = ?',
            [announcementId]
        );

        if (!announcement[0]) {
            throw new Error('Announcement not found');
        }

        const newPinStatus = !announcement[0].is_pinned;
        await pool.query(
            'UPDATE announcement SET is_pinned = ? WHERE announcement_id = ?',
            [newPinStatus, announcementId]
        );

        return { success: true, is_pinned: newPinStatus };
    }
};

module.exports = announcementService;
