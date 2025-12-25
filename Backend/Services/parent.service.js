/**
 * Parent Service
 * Business logic for the Parent-Teacher Portal
 */

const pool = require('../Db_config/DB');
const ParentEntity = require('../EAV models/parent_entity');
const ParentValue = require('../EAV models/parent_value');
const ParentAttribute = require('../EAV models/parent_attribute');
const bcrypt = require('bcryptjs');

// Helper: Get attribute ID
async function getParentAttrId(name) {
    const [rows] = await pool.query(
        "SELECT attribute_id FROM parent_attributes WHERE attribute_name = ?",
        [name]
    );
    return rows[0]?.attribute_id;
}

// Helper: Get enrollment attribute ID
async function getEnrollmentAttrId(name) {
    const [rows] = await pool.query(
        "SELECT attribute_id FROM enrollment_attributes WHERE attribute_name = ?",
        [name]
    );
    return rows[0]?.attribute_id;
}

const parentService = {
    // =====================================================
    // Authentication & Profile
    // =====================================================

    /**
     * Create a new parent account
     */
    async createParent(data) {
        const { email, password, full_name, phone, address, occupation, relationship } = data;

        // Check if email already exists
        const existing = await ParentEntity.findByAttribute('email', email);
        if (existing) {
            throw new Error('Email already registered');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create parent entity
        const parentId = await ParentEntity.create(full_name);

        // Set attributes
        await ParentValue.setMultiple(parentId, {
            email,
            password: hashedPassword,
            full_name,
            phone: phone || '',
            address: address || '',
            occupation: occupation || '',
            relationship: relationship || 'parent',
            notification_preference: 'email'
        });

        return { parentId, email, full_name };
    },

    /**
     * Authenticate parent login
     */
    async authenticateParent(email, password) {
        const parent = await ParentEntity.findByAttribute('email', email);
        if (!parent) {
            throw new Error('Invalid email or password');
        }

        const storedPassword = await ParentValue.get(parent.entity_id, 'password');
        const isValid = await bcrypt.compare(password, storedPassword);

        if (!isValid) {
            throw new Error('Invalid email or password');
        }

        const attributes = await ParentValue.getAllForEntity(parent.entity_id);
        delete attributes.password;

        return {
            entity_id: parent.entity_id,
            entity_type: 'parent',
            entity_name: parent.entity_name,
            ...attributes
        };
    },

    /**
     * Get parent profile by ID
     */
    async getParentProfile(parentId) {
        const parent = await ParentEntity.findById(parentId);
        if (!parent) {
            throw new Error('Parent not found');
        }

        const attributes = await ParentValue.getAllForEntity(parentId);
        delete attributes.password;

        return {
            entity_id: parent.entity_id,
            entity_name: parent.entity_name,
            created_at: parent.created_at,
            ...attributes
        };
    },

    /**
     * Update parent profile
     */
    async updateParentProfile(parentId, data) {
        const { full_name, phone, address, occupation, notification_preference } = data;

        // Update entity name if full_name changed
        if (full_name) {
            await ParentEntity.update(parentId, full_name);
        }

        const updates = {};
        if (full_name) updates.full_name = full_name;
        if (phone !== undefined) updates.phone = phone;
        if (address !== undefined) updates.address = address;
        if (occupation !== undefined) updates.occupation = occupation;
        if (notification_preference !== undefined) updates.notification_preference = notification_preference;

        if (Object.keys(updates).length > 0) {
            await ParentValue.setMultiple(parentId, updates);
        }

        return this.getParentProfile(parentId);
    },

    // =====================================================
    // Student Management
    // =====================================================

    /**
     * Get all linked students for a parent
     */
    async getLinkedStudents(parentId) {
        console.log('[Parent Service] Getting linked students for parent:', parentId);

        let students = [];
        try {
            students = await ParentEntity.getLinkedStudents(parentId);
        } catch (e) {
            console.error('[Parent Service] Error from ParentEntity.getLinkedStudents:', e.message);
            return [];
        }

        console.log('[Parent Service] Found', students.length, 'linked students');

        // Enrich with student attributes (optional, don't fail if missing)
        const enrichedStudents = await Promise.all(students.map(async (student) => {
            try {
                // Get student attributes from main entities EAV
                const [attrs] = await pool.query(
                    `SELECT a.attribute_name, ea.value_string, ea.value_int
                     FROM entity_attribute ea
                     JOIN attributes a ON ea.attribute_id = a.attribute_id
                     WHERE ea.entity_id = ?`,
                    [student.student_id]
                );

                const studentAttrs = {};
                attrs.forEach(attr => {
                    studentAttrs[attr.attribute_name] = attr.value_string || attr.value_int;
                });

                return {
                    ...student,
                    email: studentAttrs.email,
                    username: studentAttrs.username
                };
            } catch (e) {
                console.error('[Parent Service] Error enriching student', student.student_id, ':', e.message);
                return student;
            }
        }));

        return enrichedStudents;
    },

    /**
     * Request to link a student (sets status to pending)
     */
    async requestStudentLink(parentId, studentEmail, relationship = 'Parent') {
        // Find student by email using EAV pattern
        const [students] = await pool.query(
            `SELECT e.entity_id, e.entity_name 
             FROM entities e
             JOIN entity_attribute ea ON e.entity_id = ea.entity_id
             JOIN attributes a ON ea.attribute_id = a.attribute_id
             WHERE a.attribute_name = 'email' 
             AND ea.value_string = ? 
             AND e.entity_type = 'student'
             LIMIT 1`,
            [studentEmail]
        );

        if (students.length === 0) {
            throw new Error('Student not found with this email');
        }
        const student = students[0];

        // Check for existing link
        const [existing] = await pool.query(
            "SELECT link_id, link_status FROM parent_student_link WHERE parent_id = ? AND student_id = ?",
            [parentId, student.entity_id]
        );

        if (existing.length > 0) {
            if (existing[0].link_status === 'active') {
                throw new Error('You are already linked to this student');
            } else if (existing[0].link_status === 'pending') {
                throw new Error('Link request is already pending approval');
            }

            // Re-submit if previously rejected or inactive
            await pool.query(
                "UPDATE parent_student_link SET link_status = 'pending', relationship = ? WHERE link_id = ?",
                [relationship, existing[0].link_id]
            );
            return { success: true, message: 'Link request resubmitted successfully', studentName: student.entity_name };
        }

        // Create new pending link
        await pool.query(
            "INSERT INTO parent_student_link (parent_id, student_id, relationship, link_status) VALUES (?, ?, ?, 'pending')",
            [parentId, student.entity_id, relationship]
        );

        return { success: true, message: 'Link request submitted for approval', studentName: student.entity_name };
    },

    /**
     * Link a parent to a student (admin function - approve/force link)
     */
    async linkStudentToParent(parentId, studentId, relationship = 'parent') {
        // Verify student exists
        const [student] = await pool.query(
            "SELECT * FROM entities WHERE entity_id = ? AND entity_type = 'student'",
            [studentId]
        );
        if (!student[0]) {
            throw new Error('Student not found');
        }

        await ParentEntity.linkStudent(parentId, studentId, relationship);
        return { success: true, message: 'Student linked successfully' };
    },

    // =====================================================
    // Student Progress (Grades, Attendance, Remarks)
    // =====================================================

    /**
     * Get student progress (grades, GPA, courses)
     */
    async getStudentProgress(parentId, studentId) {
        // Verify parent is linked to student
        const isLinked = await ParentEntity.isLinkedToStudent(parentId, studentId);
        if (!isLinked) {
            throw new Error('You are not authorized to view this student\'s progress');
        }

        // Get enrolled courses with grades
        const [enrollments] = await pool.query(
            `SELECT 
                ee.entity_id as enrollment_id,
                ee.entity_name,
                ce.entity_id as course_id,
                ce.entity_name as course_name,
                (SELECT eea.value_string FROM enrollment_entity_attribute eea 
                 JOIN enrollment_attributes ea ON eea.attribute_id = ea.attribute_id 
                 WHERE eea.entity_id = ee.entity_id AND ea.attribute_name = 'status') as status,
                (SELECT eea.value_number FROM enrollment_entity_attribute eea 
                 JOIN enrollment_attributes ea ON eea.attribute_id = ea.attribute_id 
                 WHERE eea.entity_id = ee.entity_id AND ea.attribute_name = 'grade') as grade
             FROM enrollment_entity ee
             JOIN enrollment_entity_attribute eea1 ON ee.entity_id = eea1.entity_id
             JOIN enrollment_attributes ea1 ON eea1.attribute_id = ea1.attribute_id
             JOIN course_entity ce ON eea1.value_reference = ce.entity_id
             WHERE ea1.attribute_name = 'course_id'
             AND EXISTS (
                 SELECT 1 FROM enrollment_entity_attribute eea2
                 JOIN enrollment_attributes ea2 ON eea2.attribute_id = ea2.attribute_id
                 WHERE eea2.entity_id = ee.entity_id 
                 AND ea2.attribute_name = 'student_id' 
                 AND eea2.value_reference = ?
             )`,
            [studentId]
        );

        // Calculate GPA (4.0 scale)
        let totalPoints = 0;
        let totalCourses = 0;

        enrollments.forEach(e => {
            if (e.grade !== null && e.status === 'completed') {
                totalPoints += e.grade;
                totalCourses++;
            }
        });

        const gpa = totalCourses > 0 ? (totalPoints / totalCourses).toFixed(2) : 'N/A';

        return {
            studentId,
            enrollments,
            gpa,
            totalCourses: enrollments.length,
            completedCourses: enrollments.filter(e => e.status === 'completed').length
        };
    },

    /**
     * Get student attendance records
     */
    async getStudentAttendance(parentId, studentId, courseId = null) {
        // Verify parent is linked to student
        const isLinked = await ParentEntity.isLinkedToStudent(parentId, studentId);
        if (!isLinked) {
            throw new Error('You are not authorized to view this student\'s attendance');
        }

        let query = `
            SELECT 
                sa.*,
                ce.entity_name as course_name
            FROM student_attendance sa
            JOIN course_entity ce ON sa.course_id = ce.entity_id
            WHERE sa.student_id = ?
        `;
        const params = [studentId];

        if (courseId) {
            query += ' AND sa.course_id = ?';
            params.push(courseId);
        }

        query += ' ORDER BY sa.attendance_date DESC';

        const [attendance] = await pool.query(query, params);

        // Calculate stats
        const stats = {
            total: attendance.length,
            present: attendance.filter(a => a.status === 'present').length,
            absent: attendance.filter(a => a.status === 'absent').length,
            late: attendance.filter(a => a.status === 'late').length,
            excused: attendance.filter(a => a.status === 'excused').length
        };

        stats.attendanceRate = stats.total > 0
            ? ((stats.present + stats.excused) / stats.total * 100).toFixed(1) + '%'
            : 'N/A';

        return { attendance, stats };
    },

    /**
     * Get teacher remarks for a student
     */
    async getStudentRemarks(parentId, studentId) {
        // Verify parent is linked to student
        const isLinked = await ParentEntity.isLinkedToStudent(parentId, studentId);
        if (!isLinked) {
            throw new Error('You are not authorized to view this student\'s remarks');
        }

        const [remarks] = await pool.query(
            `SELECT 
                sr.*,
                ce.entity_name as course_name,
                se.entity_name as teacher_name
             FROM student_remarks sr
             JOIN course_entity ce ON sr.course_id = ce.entity_id
             JOIN staff_entity se ON sr.teacher_id = se.entity_id
             WHERE sr.student_id = ? AND sr.is_visible_to_parent = TRUE
             ORDER BY sr.created_at DESC`,
            [studentId]
        );

        return remarks;
    },

    // =====================================================
    // Messaging
    // =====================================================

    /**
     * Get all message threads for a parent
     */
    async getMessageThreads(parentId) {
        const [threads] = await pool.query(
            `SELECT 
                ptm.teacher_id,
                se.entity_name as teacher_name,
                e.entity_name as student_name,
                ptm.student_id,
                MAX(ptm.created_at) as last_message_at,
                SUM(CASE WHEN ptm.is_read = FALSE AND ptm.sender_type = 'teacher' THEN 1 ELSE 0 END) as unread_count
             FROM parent_teacher_message ptm
             JOIN staff_entity se ON ptm.teacher_id = se.entity_id
             JOIN entities e ON ptm.student_id = e.entity_id
             WHERE ptm.parent_id = ?
             GROUP BY ptm.teacher_id, ptm.student_id
             ORDER BY last_message_at DESC`,
            [parentId]
        );

        return threads;
    },

    /**
     * Get messages with a specific teacher
     */
    async getMessages(parentId, teacherId, studentId = null) {
        let query = `
            SELECT 
                ptm.*,
                se.entity_name as teacher_name,
                pe.entity_name as parent_name,
                e.entity_name as student_name
            FROM parent_teacher_message ptm
            JOIN staff_entity se ON ptm.teacher_id = se.entity_id
            JOIN parent_entity pe ON ptm.parent_id = pe.entity_id
            JOIN entities e ON ptm.student_id = e.entity_id
            WHERE ptm.parent_id = ? AND ptm.teacher_id = ?
        `;
        const params = [parentId, teacherId];

        if (studentId) {
            query += ' AND ptm.student_id = ?';
            params.push(studentId);
        }

        query += ' ORDER BY ptm.created_at ASC';

        const [messages] = await pool.query(query, params);

        // Mark messages as read
        await pool.query(
            `UPDATE parent_teacher_message 
             SET is_read = TRUE 
             WHERE parent_id = ? AND teacher_id = ? AND sender_type = 'teacher' AND is_read = FALSE`,
            [parentId, teacherId]
        );

        return messages;
    },

    /**
     * Send a message to a teacher
     */
    async sendMessage(parentId, teacherId, studentId, subject, messageBody) {
        // Verify parent is linked to student
        const isLinked = await ParentEntity.isLinkedToStudent(parentId, studentId);
        if (!isLinked) {
            throw new Error('You can only send messages about your linked students');
        }

        // Verify teacher exists
        const [teacher] = await pool.query(
            "SELECT * FROM staff_entity WHERE entity_id = ?",
            [teacherId]
        );
        if (!teacher[0]) {
            throw new Error('Teacher not found');
        }

        const [result] = await pool.query(
            `INSERT INTO parent_teacher_message 
             (parent_id, teacher_id, student_id, sender_type, subject, message_body)
             VALUES (?, ?, ?, 'parent', ?, ?)`,
            [parentId, teacherId, studentId, subject, messageBody]
        );

        return { messageId: result.insertId, success: true };
    },

    /**
     * Get teachers associated with a parent's linked students
     */
    async getAvailableTeachers(parentId) {
        const [teachers] = await pool.query(
            `SELECT DISTINCT 
                se.entity_id as teacher_id,
                se.entity_name as teacher_name,
                se.entity_type
             FROM parent_student_link psl
             JOIN enrollment_entity_attribute eea ON eea.value_reference = psl.student_id
             JOIN enrollment_attributes ea ON eea.attribute_id = ea.attribute_id AND ea.attribute_name = 'student_id'
             JOIN enrollment_entity_attribute eea2 ON eea2.entity_id = eea.entity_id
             JOIN enrollment_attributes ea2 ON eea2.attribute_id = ea2.attribute_id AND ea2.attribute_name = 'course_id'
             JOIN course_entity_attribute cea ON cea.value_reference = eea2.value_reference
             JOIN course_attributes ca ON cea.attribute_id = ca.attribute_id AND ca.attribute_name = 'instructor_id'
             JOIN staff_entity se ON cea.value_reference = se.entity_id
             WHERE psl.parent_id = ? AND psl.link_status = 'active'`,
            [parentId]
        );

        return teachers;
    },

    // =====================================================
    // Announcements
    // =====================================================

    /**
     * Get all announcements for parents
     */
    async getAnnouncements(parentId) {
        const [announcements] = await pool.query(
            `SELECT 
                pa.*,
                CASE WHEN par.id IS NOT NULL THEN TRUE ELSE FALSE END as is_read,
                par.read_at
             FROM parent_announcement pa
             LEFT JOIN parent_announcement_read par 
                ON pa.announcement_id = par.announcement_id AND par.parent_id = ?
             WHERE pa.target_type = 'all' 
                OR pa.announcement_id IN (
                    SELECT announcement_id FROM parent_announcement 
                    WHERE target_type = 'specific'
                )
             ORDER BY pa.created_at DESC`,
            [parentId]
        );

        return announcements;
    },

    /**
     * Mark an announcement as read
     */
    async markAnnouncementRead(parentId, announcementId) {
        await pool.query(
            `INSERT INTO parent_announcement_read (announcement_id, parent_id)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE read_at = CURRENT_TIMESTAMP`,
            [announcementId, parentId]
        );

        return { success: true };
    },

    /**
     * Get unread announcement count
     */
    async getUnreadAnnouncementCount(parentId) {
        const [result] = await pool.query(
            `SELECT COUNT(*) as count
             FROM parent_announcement pa
             LEFT JOIN parent_announcement_read par 
                ON pa.announcement_id = par.announcement_id AND par.parent_id = ?
             WHERE par.id IS NULL
             AND (pa.expires_at IS NULL OR pa.expires_at > NOW())`,
            [parentId]
        );

        return result[0].count;
    },

    // =====================================================
    // Dashboard Stats
    // =====================================================

    /**
     * Get dashboard overview for a parent
     */
    async getDashboardOverview(parentId) {
        // Get linked students (this should always work)
        let students = [];
        try {
            students = await this.getLinkedStudents(parentId);
        } catch (e) {
            console.error('Error getting linked students:', e.message);
        }

        // Get unread message count (optional - may fail if table doesn't exist)
        let unreadMessages = 0;
        try {
            unreadMessages = await this.getUnreadMessageCount(parentId);
        } catch (e) {
            console.error('Error getting unread messages:', e.message);
        }

        // Get unread announcement count (optional - may fail if table doesn't exist)
        let unreadAnnouncements = 0;
        try {
            unreadAnnouncements = await this.getUnreadAnnouncementCount(parentId);
        } catch (e) {
            console.error('Error getting unread announcements:', e.message);
        }

        // Get recent announcements (optional)
        let recentAnnouncements = [];
        try {
            const [rows] = await pool.query(
                `SELECT title, priority, created_at 
                 FROM parent_announcement 
                 ORDER BY created_at DESC LIMIT 3`
            );
            recentAnnouncements = rows;
        } catch (e) {
            console.error('Error getting recent announcements:', e.message);
        }

        return {
            linkedStudents: students.length,
            students: students.map(s => ({
                id: s.student_id,
                name: s.student_name,
                relationship: s.relationship
            })),
            unreadMessages,
            unreadAnnouncements,
            recentAnnouncements
        };
    },

    /**
     * Get unread message count
     */
    async getUnreadMessageCount(parentId) {
        const [result] = await pool.query(
            `SELECT COUNT(*) as count
             FROM parent_teacher_message
             WHERE parent_id = ? AND sender_type = 'teacher' AND is_read = FALSE`,
            [parentId]
        );

        return result[0].count;
    }
};

module.exports = parentService;
