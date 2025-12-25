/**
 * Access Control Utility
 * Provides role-based visibility and relationship validation functions
 * for the Community Module (messaging, announcements, events)
 */

const pool = require('../Db_config/DB');

const accessControl = {
    // =====================================================
    // Relationship Queries
    // =====================================================

    /**
     * Get all students linked to a parent
     * @param {number} parentId - The parent's entity ID
     * @returns {Promise<Array>} Array of linked student IDs and info
     */
    async getLinkedStudentsForParent(parentId) {
        const [students] = await pool.query(`
            SELECT 
                psl.student_id,
                psl.relationship,
                e.entity_name as student_name,
                e.entity_email as student_email
            FROM parent_student_link psl
            LEFT JOIN entities e ON psl.student_id = e.entity_id
            WHERE psl.parent_id = ?
        `, [parentId]);
        return students;
    },

    /**
     * Get all students enrolled in courses taught by a staff member
     * Only returns students from CURRENT active courses
     * @param {number} staffId - The staff member's entity ID
     * @returns {Promise<Array>} Array of student IDs and info
     */
    async getAssignedStudentsForStaff(staffId) {
        // Get students from courses where this staff is assigned
        const [students] = await pool.query(`
            SELECT DISTINCT
                e.entity_id as student_id,
                e.entity_name as student_name,
                e.entity_email as student_email,
                c.title as course_title,
                c.code as course_code
            FROM staff_course_assignment sca
            JOIN course_entity c ON sca.course_id = c._id
            JOIN enrollment_entity ee ON 1=1
            JOIN enrollment_entity_attribute eea_course 
                ON ee.entity_id = eea_course.entity_id
                AND eea_course.attribute_id = (SELECT attribute_id FROM enrollment_attributes WHERE attribute_name = 'courseId')
                AND eea_course.value_string = CAST(sca.course_id AS CHAR)
            JOIN enrollment_entity_attribute eea_student 
                ON ee.entity_id = eea_student.entity_id
                AND eea_student.attribute_id = (SELECT attribute_id FROM enrollment_attributes WHERE attribute_name = 'studentId')
            JOIN enrollment_entity_attribute eea_status 
                ON ee.entity_id = eea_status.entity_id
                AND eea_status.attribute_id = (SELECT attribute_id FROM enrollment_attributes WHERE attribute_name = 'status')
                AND eea_status.value_string = 'APPROVED'
            JOIN entities e ON eea_student.value_string = CAST(e.entity_id AS CHAR)
            WHERE sca.staff_id = ?
            AND sca.status = 'active'
        `, [staffId]);
        return students;
    },

    /**
     * Get all staff members assigned to a student's courses
     * @param {number} studentId - The student's entity ID
     * @returns {Promise<Array>} Array of staff member IDs and info
     */
    async getAssignedStaffForStudent(studentId) {
        const [staff] = await pool.query(`
            SELECT DISTINCT
                e.entity_id as staff_id,
                e.entity_name as staff_name,
                e.entity_email as staff_email,
                e.entity_type as staff_role,
                sca.role as assignment_role,
                c.title as course_title,
                c.code as course_code
            FROM enrollment_entity ee
            JOIN enrollment_entity_attribute eea_student 
                ON ee.entity_id = eea_student.entity_id
                AND eea_student.attribute_id = (SELECT attribute_id FROM enrollment_attributes WHERE attribute_name = 'studentId')
                AND eea_student.value_string = CAST(? AS CHAR)
            JOIN enrollment_entity_attribute eea_course 
                ON ee.entity_id = eea_course.entity_id
                AND eea_course.attribute_id = (SELECT attribute_id FROM enrollment_attributes WHERE attribute_name = 'courseId')
            JOIN enrollment_entity_attribute eea_status 
                ON ee.entity_id = eea_status.entity_id
                AND eea_status.attribute_id = (SELECT attribute_id FROM enrollment_attributes WHERE attribute_name = 'status')
                AND eea_status.value_string = 'APPROVED'
            JOIN staff_course_assignment sca 
                ON sca.course_id = CAST(eea_course.value_string AS UNSIGNED)
                AND sca.status = 'active'
            JOIN entities e ON sca.staff_id = e.entity_id
            JOIN course_entity c ON sca.course_id = c._id
        `, [studentId]);
        return staff;
    },

    /**
     * Get teachers for a parent's linked children
     * @param {number} parentId - The parent's entity ID
     * @returns {Promise<Array>} Array of teacher IDs and info
     */
    async getTeachersForParent(parentId) {
        // Get linked students first
        const students = await this.getLinkedStudentsForParent(parentId);
        const studentIds = students.map(s => s.student_id);

        if (studentIds.length === 0) {
            return [];
        }

        // Get teachers for all linked students' courses
        const placeholders = studentIds.map(() => '?').join(',');
        const [teachers] = await pool.query(`
            SELECT DISTINCT
                e.entity_id as staff_id,
                e.entity_name as staff_name,
                e.entity_email as staff_email,
                e.entity_type as staff_role,
                sca.role as assignment_role,
                c.title as course_title,
                c.code as course_code
            FROM enrollment_entity ee
            JOIN enrollment_entity_attribute eea_student 
                ON ee.entity_id = eea_student.entity_id
                AND eea_student.attribute_id = (SELECT attribute_id FROM enrollment_attributes WHERE attribute_name = 'studentId')
                AND eea_student.value_string IN (${studentIds.map(id => `'${id}'`).join(',')})
            JOIN enrollment_entity_attribute eea_course 
                ON ee.entity_id = eea_course.entity_id
                AND eea_course.attribute_id = (SELECT attribute_id FROM enrollment_attributes WHERE attribute_name = 'courseId')
            JOIN enrollment_entity_attribute eea_status 
                ON ee.entity_id = eea_status.entity_id
                AND eea_status.attribute_id = (SELECT attribute_id FROM enrollment_attributes WHERE attribute_name = 'status')
                AND eea_status.value_string = 'APPROVED'
            JOIN staff_course_assignment sca 
                ON sca.course_id = CAST(eea_course.value_string AS UNSIGNED)
                AND sca.status = 'active'
            JOIN entities e ON sca.staff_id = e.entity_id
            JOIN course_entity c ON sca.course_id = c._id
        `);
        return teachers;
    },

    // =====================================================
    // Access Validation Functions
    // =====================================================

    /**
     * Check if a user can access another user's data
     * @param {number} userId - The requesting user's ID
     * @param {string} userType - The requesting user's type (student, parent, doctor, admin, etc.)
     * @param {number} targetStudentId - The student ID to access
     * @returns {Promise<boolean>} Whether access is allowed
     */
    async canAccessStudentData(userId, userType, targetStudentId) {
        // Admins have full access
        if (userType === 'admin') {
            return true;
        }

        // Students can only access their own data
        if (userType === 'student') {
            return userId === targetStudentId || userId.toString() === targetStudentId.toString();
        }

        // Parents can access their linked children's data
        if (userType === 'parent') {
            const linkedStudents = await this.getLinkedStudentsForParent(userId);
            return linkedStudents.some(s =>
                s.student_id === targetStudentId ||
                s.student_id.toString() === targetStudentId.toString()
            );
        }

        // Staff (doctor, ta, advisor) can access students in their courses
        if (['doctor', 'ta', 'advisor', 'staff'].includes(userType)) {
            const assignedStudents = await this.getAssignedStudentsForStaff(userId);
            return assignedStudents.some(s =>
                s.student_id === targetStudentId ||
                s.student_id.toString() === targetStudentId.toString()
            );
        }

        return false;
    },

    /**
     * Check if two users can communicate with each other
     * @param {number} userId - First user's ID
     * @param {string} userType - First user's type
     * @param {number} targetId - Second user's ID
     * @param {string} targetType - Second user's type
     * @returns {Promise<boolean>} Whether communication is allowed
     */
    async canCommunicate(userId, userType, targetId, targetType) {
        // Admins can communicate with anyone
        if (userType === 'admin') {
            return true;
        }

        // Student to Staff: Check if staff teaches student's course
        if (userType === 'student' && ['doctor', 'ta', 'advisor', 'staff'].includes(targetType)) {
            const assignedStaff = await this.getAssignedStaffForStudent(userId);
            return assignedStaff.some(s =>
                s.staff_id === targetId ||
                s.staff_id.toString() === targetId.toString()
            );
        }

        // Staff to Student: Check if student is in staff's course
        if (['doctor', 'ta', 'advisor', 'staff'].includes(userType) && targetType === 'student') {
            const assignedStudents = await this.getAssignedStudentsForStaff(userId);
            return assignedStudents.some(s =>
                s.student_id === targetId ||
                s.student_id.toString() === targetId.toString()
            );
        }

        // Parent to Staff: Check if staff teaches parent's children
        if (userType === 'parent' && ['doctor', 'ta', 'advisor', 'staff'].includes(targetType)) {
            const teachers = await this.getTeachersForParent(userId);
            return teachers.some(t =>
                t.staff_id === targetId ||
                t.staff_id.toString() === targetId.toString()
            );
        }

        // Staff to Staff: Allow by default
        if (['doctor', 'ta', 'advisor', 'staff'].includes(userType) &&
            ['doctor', 'ta', 'advisor', 'staff'].includes(targetType)) {
            return true;
        }

        return false;
    },

    /**
     * Get all user IDs that a user can access/see
     * @param {number} userId - The requesting user's ID
     * @param {string} userType - The requesting user's type
     * @returns {Promise<Object>} Object with accessible student and staff IDs
     */
    async getAccessibleUserIds(userId, userType) {
        const result = {
            studentIds: [],
            staffIds: [],
            isFullAccess: false
        };

        // Admins have full access
        if (userType === 'admin') {
            result.isFullAccess = true;
            return result;
        }

        // Students can access their own data and assigned staff
        if (userType === 'student') {
            result.studentIds = [userId];
            const assignedStaff = await this.getAssignedStaffForStudent(userId);
            result.staffIds = assignedStaff.map(s => s.staff_id);
        }

        // Parents can access their children's data and their teachers
        if (userType === 'parent') {
            const linkedStudents = await this.getLinkedStudentsForParent(userId);
            result.studentIds = linkedStudents.map(s => s.student_id);
            const teachers = await this.getTeachersForParent(userId);
            result.staffIds = teachers.map(t => t.staff_id);
        }

        // Staff can access their assigned students
        if (['doctor', 'ta', 'advisor', 'staff'].includes(userType)) {
            const assignedStudents = await this.getAssignedStudentsForStaff(userId);
            result.studentIds = assignedStudents.map(s => s.student_id);
            // Staff can message other staff
            result.staffIds = []; // Will be populated when needed
        }

        return result;
    },

    /**
     * Get course IDs for a user
     * @param {number} userId - User's ID
     * @param {string} userType - User's type
     * @returns {Promise<Array>} Array of course IDs
     */
    async getUserCourseIds(userId, userType) {
        if (userType === 'student') {
            const [courses] = await pool.query(`
                SELECT DISTINCT CAST(eea_course.value_string AS UNSIGNED) as course_id
                FROM enrollment_entity ee
                JOIN enrollment_entity_attribute eea_student 
                    ON ee.entity_id = eea_student.entity_id
                    AND eea_student.attribute_id = (SELECT attribute_id FROM enrollment_attributes WHERE attribute_name = 'studentId')
                    AND eea_student.value_string = CAST(? AS CHAR)
                JOIN enrollment_entity_attribute eea_course 
                    ON ee.entity_id = eea_course.entity_id
                    AND eea_course.attribute_id = (SELECT attribute_id FROM enrollment_attributes WHERE attribute_name = 'courseId')
                JOIN enrollment_entity_attribute eea_status 
                    ON ee.entity_id = eea_status.entity_id
                    AND eea_status.attribute_id = (SELECT attribute_id FROM enrollment_attributes WHERE attribute_name = 'status')
                    AND eea_status.value_string = 'APPROVED'
            `, [userId]);
            return courses.map(c => c.course_id);
        }

        if (['doctor', 'ta', 'advisor', 'staff'].includes(userType)) {
            const [courses] = await pool.query(`
                SELECT course_id FROM staff_course_assignment 
                WHERE staff_id = ? AND status = 'active'
            `, [userId]);
            return courses.map(c => c.course_id);
        }

        if (userType === 'parent') {
            // Get courses from all linked children
            const linkedStudents = await this.getLinkedStudentsForParent(userId);
            const allCourseIds = [];
            for (const student of linkedStudents) {
                const studentCourses = await this.getUserCourseIds(student.student_id, 'student');
                allCourseIds.push(...studentCourses);
            }
            return [...new Set(allCourseIds)]; // Remove duplicates
        }

        return [];
    }
};

module.exports = accessControl;
