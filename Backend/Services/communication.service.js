/**
 * Communication Service
 * Business logic for Student-Staff Communication module
 * 
 * Note: This service uses user entity_ids from the 'entities' table for both 
 * students and staff (not staff_entity). This ensures JWT token IDs work correctly.
 */

const pool = require('../Db_config/DB');

const communicationService = {
    // =====================================================
    // Conversations
    // =====================================================

    /**
     * Get all conversations for a user
     */
    async getConversations(userId, userType) {
        const isStudent = userType === 'student';
        const userColumn = isStudent ? 'student_id' : 'staff_id';
        const otherColumn = isStudent ? 'staff_id' : 'student_id';

        // Both students and staff are in 'entities' table for auth purposes
        const [conversations] = await pool.query(`
            SELECT 
                c.*,
                e.entity_name as other_name,
                e.entity_type as other_type,
                (SELECT COUNT(*) FROM student_staff_message m 
                 WHERE m.conversation_id = c.conversation_id 
                 AND m.is_read = FALSE 
                 AND m.sender_type != ?) as unread_count,
                (SELECT message_text FROM student_staff_message m 
                 WHERE m.conversation_id = c.conversation_id 
                 ORDER BY m.created_at DESC LIMIT 1) as last_message,
                (SELECT created_at FROM student_staff_message m 
                 WHERE m.conversation_id = c.conversation_id 
                 ORDER BY m.created_at DESC LIMIT 1) as last_message_at
            FROM student_staff_conversation c
            LEFT JOIN entities e ON c.${otherColumn} = e.entity_id
            WHERE c.${userColumn} = ?
            ORDER BY 
                CASE WHEN last_message_at IS NULL THEN 1 ELSE 0 END,
                last_message_at DESC
        `, [userType, userId]);

        return conversations;
    },

    /**
     * Get a single conversation by ID
     */
    async getConversationById(conversationId, userId, userType) {
        const [conversations] = await pool.query(`
            SELECT c.*,
                   s.entity_name as student_name,
                   st.entity_name as staff_name
            FROM student_staff_conversation c
            LEFT JOIN entities s ON c.student_id = s.entity_id
            LEFT JOIN entities st ON c.staff_id = st.entity_id
            WHERE c.conversation_id = ?
            AND (c.student_id = ? OR c.staff_id = ?)
        `, [conversationId, userId, userId]);

        return conversations[0] || null;
    },

    /**
     * Create a new conversation
     */
    async createConversation(studentId, staffId, staffType, subject) {
        console.log('[COMM Service] createConversation:', { studentId, staffId, staffType, subject });

        // Check if conversation already exists
        const [existing] = await pool.query(
            `SELECT * FROM student_staff_conversation 
             WHERE student_id = ? AND staff_id = ?`,
            [studentId, staffId]
        );

        if (existing.length > 0) {
            console.log('[COMM Service] Found existing conversation:', existing[0].conversation_id);
            return existing[0];
        }

        const [result] = await pool.query(
            `INSERT INTO student_staff_conversation (student_id, staff_id, staff_type, subject)
             VALUES (?, ?, ?, ?)`,
            [studentId, staffId, staffType, subject]
        );

        console.log('[COMM Service] Created new conversation:', result.insertId);
        return { conversation_id: result.insertId, student_id: studentId, staff_id: staffId, staff_type: staffType };
    },

    /**
     * Archive a conversation
     */
    async archiveConversation(conversationId) {
        await pool.query(
            `UPDATE student_staff_conversation SET status = 'archived' WHERE conversation_id = ?`,
            [conversationId]
        );
        return { success: true };
    },

    // =====================================================
    // Messages
    // =====================================================

    /**
     * Get messages in a conversation
     */
    async getMessages(conversationId) {
        const [messages] = await pool.query(`
            SELECT m.*,
                   e.entity_name as sender_name
            FROM student_staff_message m
            LEFT JOIN entities e ON m.sender_id = e.entity_id
            WHERE m.conversation_id = ?
            ORDER BY m.created_at ASC
        `, [conversationId]);

        return messages;
    },

    /**
     * Send a message
     */
    async sendMessage(conversationId, senderId, senderType, messageText) {
        console.log('[COMM Service] sendMessage:', { conversationId, senderId, senderType, messageText: messageText.substring(0, 50) });

        const [result] = await pool.query(
            `INSERT INTO student_staff_message (conversation_id, sender_id, sender_type, message_text)
             VALUES (?, ?, ?, ?)`,
            [conversationId, senderId, senderType, messageText]
        );

        // Update conversation timestamp
        await pool.query(
            `UPDATE student_staff_conversation SET updated_at = NOW() WHERE conversation_id = ?`,
            [conversationId]
        );

        // Get the full message with sender name
        const [newMessage] = await pool.query(`
            SELECT m.*,
                   e.entity_name as sender_name
            FROM student_staff_message m
            LEFT JOIN entities e ON m.sender_id = e.entity_id
            WHERE m.message_id = ?
        `, [result.insertId]);

        console.log('[COMM Service] Message saved with ID:', result.insertId);

        return {
            message_id: result.insertId,
            message: newMessage[0],
            success: true
        };
    },

    /**
     * Update message status
     */
    async updateMessageStatus(messageId, status) {
        await pool.query(
            `UPDATE student_staff_message SET status = ? WHERE message_id = ?`,
            [status, messageId]
        );
        return { success: true };
    },

    /**
     * Mark messages as read
     */
    async markMessagesAsRead(conversationId, readerType) {
        const senderType = readerType === 'student' ? 'staff' : 'student';
        await pool.query(
            `UPDATE student_staff_message 
             SET is_read = TRUE 
             WHERE conversation_id = ? AND sender_type = ? AND is_read = FALSE`,
            [conversationId, senderType]
        );
        return { success: true };
    },

    /**
     * Get unread message count
     */
    async getUnreadCount(userId, userType) {
        const column = userType === 'student' ? 'student_id' : 'staff_id';
        const senderType = userType === 'student' ? 'staff' : 'student';

        const [result] = await pool.query(`
            SELECT COUNT(*) as count
            FROM student_staff_message m
            JOIN student_staff_conversation c ON m.conversation_id = c.conversation_id
            WHERE c.${column} = ? AND m.sender_type = ? AND m.is_read = FALSE
        `, [userId, senderType]);

        return result[0].count;
    },

    // =====================================================
    // Meeting Requests
    // =====================================================

    /**
     * Create a meeting request
     */
    async createMeetingRequest(studentId, staffId, staffType, data) {
        const { purpose, proposed_date, proposed_time, duration_minutes } = data;

        const [result] = await pool.query(
            `INSERT INTO meeting_request 
             (student_id, staff_id, staff_type, purpose, proposed_date, proposed_time, duration_minutes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [studentId, staffId, staffType, purpose, proposed_date, proposed_time, duration_minutes || 30]
        );

        return { request_id: result.insertId, success: true };
    },

    /**
     * Get meeting requests for a user
     */
    async getMeetingRequests(userId, userType, status = null) {
        const column = userType === 'student' ? 'student_id' : 'staff_id';
        const otherColumn = userType === 'student' ? 'staff_id' : 'student_id';

        let query = `
            SELECT mr.*,
                   e.entity_name as other_name
            FROM meeting_request mr
            LEFT JOIN entities e ON mr.${otherColumn} = e.entity_id
            WHERE mr.${column} = ?
        `;
        const params = [userId];

        if (status) {
            query += ' AND mr.status = ?';
            params.push(status);
        }

        query += ' ORDER BY mr.proposed_date ASC, mr.proposed_time ASC';

        const [requests] = await pool.query(query, params);
        return requests;
    },

    /**
     * Update meeting request (approve/reject/complete)
     */
    async updateMeetingRequest(requestId, staffId, data) {
        const { status, staff_notes, location, rejection_reason } = data;

        // Verify staff owns this request
        const [request] = await pool.query(
            'SELECT * FROM meeting_request WHERE request_id = ? AND staff_id = ?',
            [requestId, staffId]
        );

        if (!request[0]) {
            throw new Error('Meeting request not found or unauthorized');
        }

        await pool.query(
            `UPDATE meeting_request 
             SET status = ?, staff_notes = ?, location = ?, rejection_reason = ?
             WHERE request_id = ?`,
            [status, staff_notes || null, location || null, rejection_reason || null, requestId]
        );

        return { success: true };
    },

    /**
     * Cancel a meeting request (student)
     */
    async cancelMeetingRequest(requestId, studentId) {
        const [request] = await pool.query(
            'SELECT * FROM meeting_request WHERE request_id = ? AND student_id = ?',
            [requestId, studentId]
        );

        if (!request[0]) {
            throw new Error('Meeting request not found or unauthorized');
        }

        await pool.query(
            `UPDATE meeting_request SET status = 'cancelled' WHERE request_id = ?`,
            [requestId]
        );

        return { success: true };
    },

    // =====================================================
    // Academic Guidance
    // =====================================================

    /**
     * Create academic guidance message
     */
    async createGuidance(advisorId, studentId, data) {
        const { title, content, guidance_type, priority } = data;

        const [result] = await pool.query(
            `INSERT INTO academic_guidance 
             (student_id, advisor_id, title, content, guidance_type, priority)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [studentId, advisorId, title, content, guidance_type || 'general', priority || 'normal']
        );

        return { guidance_id: result.insertId, success: true };
    },

    /**
     * Get guidance messages for a student
     */
    async getGuidanceForStudent(studentId) {
        const [guidance] = await pool.query(`
            SELECT g.*,
                   e.entity_name as advisor_name
            FROM academic_guidance g
            LEFT JOIN entities e ON g.advisor_id = e.entity_id
            WHERE g.student_id = ?
            ORDER BY g.created_at DESC
        `, [studentId]);

        return guidance;
    },

    /**
     * Get guidance sent by an advisor
     */
    async getGuidanceByAdvisor(advisorId) {
        const [guidance] = await pool.query(`
            SELECT g.*,
                   e.entity_name as student_name
            FROM academic_guidance g
            LEFT JOIN entities e ON g.student_id = e.entity_id
            WHERE g.advisor_id = ?
            ORDER BY g.created_at DESC
        `, [advisorId]);

        return guidance;
    },

    /**
     * Mark guidance as read
     */
    async markGuidanceAsRead(guidanceId, studentId) {
        await pool.query(
            `UPDATE academic_guidance SET is_read = TRUE WHERE guidance_id = ? AND student_id = ?`,
            [guidanceId, studentId]
        );
        return { success: true };
    },

    // =====================================================
    // Staff Lookup
    // =====================================================

    /**
     * Get available staff for messaging (doctors, TAs, advisors from entities table)
     */
    async getAvailableStaff(studentId, staffType = null) {
        let query = `
            SELECT DISTINCT 
                e.entity_id,
                e.entity_name,
                e.entity_type as staff_type
            FROM entities e
            WHERE e.entity_type IN ('doctor', 'ta', 'advisor')
        `;
        const params = [];

        if (staffType) {
            query += ' AND e.entity_type = ?';
            params.push(staffType);
        }

        query += ' ORDER BY e.entity_name ASC';

        const [staff] = await pool.query(query, params);
        console.log('[COMM Service] getAvailableStaff found:', staff.length, 'staff members');
        return staff;
    }
};

module.exports = communicationService;
