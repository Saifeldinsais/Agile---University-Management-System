/**
 * Event Service
 * Business logic for events management system
 */

const pool = require('../Db_config/DB');

const eventService = {
    // =====================================================
    // Categories
    // =====================================================

    async getCategories() {
        const [categories] = await pool.query('SELECT * FROM event_category ORDER BY name');
        return categories;
    },

    // =====================================================
    // Event CRUD
    // =====================================================

    async createEvent(data, creatorId) {
        const {
            title, description, category_id, location,
            start_datetime, end_datetime, max_capacity,
            is_public, target_audience, image_url
        } = data;

        const [result] = await pool.query(
            `INSERT INTO event (title, description, category_id, location, start_datetime, end_datetime, max_capacity, is_public, target_audience, image_url, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description, category_id || null, location, start_datetime, end_datetime, max_capacity || null, is_public !== false, target_audience || 'all', image_url || null, creatorId]
        );

        return { event_id: result.insertId, success: true };
    },

    async updateEvent(eventId, data) {
        const {
            title, description, category_id, location,
            start_datetime, end_datetime, max_capacity,
            is_public, target_audience, image_url, status
        } = data;

        // Convert empty strings to null for optional fields
        const categoryValue = category_id || null;
        const capacityValue = max_capacity || null;
        const imageValue = image_url && image_url.trim() !== '' ? image_url : null;

        await pool.query(
            `UPDATE event SET 
                title = COALESCE(?, title),
                description = COALESCE(?, description),
                category_id = ?,
                location = COALESCE(?, location),
                start_datetime = COALESCE(?, start_datetime),
                end_datetime = COALESCE(?, end_datetime),
                max_capacity = ?,
                is_public = COALESCE(?, is_public),
                target_audience = COALESCE(?, target_audience),
                image_url = ?,
                status = COALESCE(?, status)
             WHERE event_id = ?`,
            [title, description, categoryValue, location, start_datetime, end_datetime, capacityValue, is_public, target_audience, imageValue, status, eventId]
        );

        return { success: true };
    },

    async deleteEvent(eventId) {
        await pool.query('DELETE FROM event WHERE event_id = ?', [eventId]);
        return { success: true };
    },

    async cancelEvent(eventId) {
        await pool.query("UPDATE event SET status = 'cancelled' WHERE event_id = ?", [eventId]);
        return { success: true };
    },

    // =====================================================
    // Get Events
    // =====================================================

    async getEvents(userId, userType, filters = {}) {
        const { startDate, endDate, category_id, status, limit } = filters;

        // Map user type to target audience
        const audienceMap = {
            'student': ['all', 'students'],
            'parent': ['all', 'parents'],
            'doctor': ['all', 'staff'],
            'ta': ['all', 'staff'],
            'admin': ['all', 'students', 'staff', 'parents']
        };

        const audiences = audienceMap[userType] || ['all'];
        const placeholders = audiences.map(() => '?').join(', ');

        let query = `
            SELECT 
                e.*,
                ec.name as category_name,
                ec.color as category_color,
                ec.icon as category_icon,
                ent.entity_name as creator_name,
                (SELECT COUNT(*) FROM event_rsvp WHERE event_id = e.event_id AND status = 'going') as going_count,
                (SELECT COUNT(*) FROM event_rsvp WHERE event_id = e.event_id AND status = 'interested') as interested_count,
                (SELECT status FROM event_rsvp WHERE event_id = e.event_id AND user_id = ?) as user_rsvp
            FROM event e
            LEFT JOIN event_category ec ON e.category_id = ec.category_id
            LEFT JOIN entities ent ON e.created_by = ent.entity_id
            WHERE e.target_audience IN (${placeholders})
        `;

        const params = [userId, ...audiences];

        if (startDate) {
            query += ' AND e.start_datetime >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND e.start_datetime <= ?';
            params.push(endDate);
        }

        if (category_id) {
            query += ' AND e.category_id = ?';
            params.push(category_id);
        }

        if (status) {
            query += ' AND e.status = ?';
            params.push(status);
        } else {
            query += " AND e.status != 'cancelled'";
        }

        query += ' ORDER BY e.start_datetime ASC';

        if (limit) {
            query += ' LIMIT ?';
            params.push(parseInt(limit));
        }

        const [events] = await pool.query(query, params);
        return events;
    },

    async getAllEvents(filters = {}) {
        const { startDate, endDate, category_id, status, limit } = filters;

        let query = `
            SELECT 
                e.*,
                ec.name as category_name,
                ec.color as category_color,
                ec.icon as category_icon,
                ent.entity_name as creator_name,
                (SELECT COUNT(*) FROM event_rsvp WHERE event_id = e.event_id AND status = 'going') as going_count,
                (SELECT COUNT(*) FROM event_rsvp WHERE event_id = e.event_id AND status = 'interested') as interested_count,
                (SELECT COUNT(*) FROM event_attendance WHERE event_id = e.event_id) as attendance_count
            FROM event e
            LEFT JOIN event_category ec ON e.category_id = ec.category_id
            LEFT JOIN entities ent ON e.created_by = ent.entity_id
            WHERE 1=1
        `;

        const params = [];

        if (startDate) {
            query += ' AND e.start_datetime >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND e.start_datetime <= ?';
            params.push(endDate);
        }

        if (category_id) {
            query += ' AND e.category_id = ?';
            params.push(category_id);
        }

        if (status) {
            query += ' AND e.status = ?';
            params.push(status);
        }

        query += ' ORDER BY e.start_datetime ASC';

        if (limit) {
            query += ' LIMIT ?';
            params.push(parseInt(limit));
        }

        const [events] = await pool.query(query, params);
        return events;
    },

    async getEventById(eventId, userId) {
        const [events] = await pool.query(`
            SELECT 
                e.*,
                ec.name as category_name,
                ec.color as category_color,
                ec.icon as category_icon,
                ent.entity_name as creator_name,
                (SELECT COUNT(*) FROM event_rsvp WHERE event_id = e.event_id AND status = 'going') as going_count,
                (SELECT COUNT(*) FROM event_rsvp WHERE event_id = e.event_id AND status = 'interested') as interested_count,
                (SELECT status FROM event_rsvp WHERE event_id = e.event_id AND user_id = ?) as user_rsvp
            FROM event e
            LEFT JOIN event_category ec ON e.category_id = ec.category_id
            LEFT JOIN entities ent ON e.created_by = ent.entity_id
            WHERE e.event_id = ?
        `, [userId, eventId]);

        return events[0] || null;
    },

    async getCalendarEvents(userId, userType, year, month) {
        // Get first and last day of month
        const startDate = `${year}-${String(month).padStart(2, '0')}-01 00:00:00`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay} 23:59:59`;

        return this.getEvents(userId, userType, { startDate, endDate });
    },

    // =====================================================
    // RSVP
    // =====================================================

    async rsvpEvent(eventId, userId, userType, status) {
        // Check if RSVP exists
        const [existing] = await pool.query(
            'SELECT rsvp_id FROM event_rsvp WHERE event_id = ? AND user_id = ?',
            [eventId, userId]
        );

        if (existing[0]) {
            // Update existing RSVP
            await pool.query(
                'UPDATE event_rsvp SET status = ? WHERE event_id = ? AND user_id = ?',
                [status, eventId, userId]
            );
        } else {
            // Create new RSVP
            await pool.query(
                'INSERT INTO event_rsvp (event_id, user_id, user_type, status) VALUES (?, ?, ?, ?)',
                [eventId, userId, userType, status]
            );
        }

        // Get updated counts
        const [counts] = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM event_rsvp WHERE event_id = ? AND status = 'going') as going_count,
                (SELECT COUNT(*) FROM event_rsvp WHERE event_id = ? AND status = 'interested') as interested_count
        `, [eventId, eventId]);

        return { success: true, ...counts[0] };
    },

    async getEventRsvps(eventId) {
        const [rsvps] = await pool.query(`
            SELECT 
                er.*,
                e.entity_name as user_name
            FROM event_rsvp er
            LEFT JOIN entities e ON er.user_id = e.entity_id
            WHERE er.event_id = ?
            ORDER BY er.rsvp_at DESC
        `, [eventId]);

        return rsvps;
    },

    // =====================================================
    // Attendance
    // =====================================================

    async checkInEvent(eventId, userId, userType) {
        await pool.query(
            `INSERT INTO event_attendance (event_id, user_id, user_type)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE check_in_time = CURRENT_TIMESTAMP`,
            [eventId, userId, userType]
        );

        return { success: true };
    },

    async checkOutEvent(eventId, userId) {
        await pool.query(
            'UPDATE event_attendance SET check_out_time = CURRENT_TIMESTAMP WHERE event_id = ? AND user_id = ?',
            [eventId, userId]
        );

        return { success: true };
    },

    async getEventAttendance(eventId) {
        const [attendance] = await pool.query(`
            SELECT 
                ea.*,
                e.entity_name as user_name
            FROM event_attendance ea
            LEFT JOIN entities e ON ea.user_id = e.entity_id
            WHERE ea.event_id = ?
            ORDER BY ea.check_in_time DESC
        `, [eventId]);

        return attendance;
    },

    // =====================================================
    // Stats
    // =====================================================

    async getEventStats(eventId) {
        const [stats] = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM event_rsvp WHERE event_id = ? AND status = 'going') as going_count,
                (SELECT COUNT(*) FROM event_rsvp WHERE event_id = ? AND status = 'interested') as interested_count,
                (SELECT COUNT(*) FROM event_rsvp WHERE event_id = ? AND status = 'not_going') as not_going_count,
                (SELECT COUNT(*) FROM event_attendance WHERE event_id = ?) as attendance_count
        `, [eventId, eventId, eventId, eventId]);

        return stats[0];
    }
};

module.exports = eventService;
