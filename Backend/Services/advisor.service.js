const pool = require("../Db_config/DB");

const advisorService = {
    // ================= ADVISOR ASSIGNMENTS =================

    /**
     * Check if a user is assigned as an advisor
     */
    isAdvisor: async (userId) => {
        try {
            const [rows] = await pool.query(
                "SELECT * FROM advisor_assignments WHERE user_entity_id = ?",
                [userId]
            );
            return { success: true, isAdvisor: rows.length > 0, data: rows[0] || null };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    /**
     * Get the department assigned to an advisor
     */
    getAdvisorDepartment: async (userId) => {
        try {
            const [rows] = await pool.query(
                "SELECT * FROM advisor_assignments WHERE user_entity_id = ?",
                [userId]
            );

            if (rows.length === 0) {
                return { success: false, message: "User is not assigned as an advisor" };
            }

            return { success: true, data: rows[0] };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    /**
     * Assign a user as advisor for a department
     * Note: A user can only be advisor for ONE department (enforced by DB)
     */
    assignAdvisorToDepartment: async (userId, department, assignedBy = null) => {
        try {
            // Check if user is already an advisor
            const [existing] = await pool.query(
                "SELECT * FROM advisor_assignments WHERE user_entity_id = ?",
                [userId]
            );

            if (existing.length > 0) {
                // Update existing assignment
                await pool.query(
                    "UPDATE advisor_assignments SET department = ?, assigned_by = ?, assigned_at = NOW() WHERE user_entity_id = ?",
                    [department, assignedBy, userId]
                );
                return { success: true, message: "Advisor department updated successfully" };
            }

            // Create new assignment
            const [result] = await pool.query(
                "INSERT INTO advisor_assignments (user_entity_id, department, assigned_by) VALUES (?, ?, ?)",
                [userId, department, assignedBy]
            );

            return {
                success: true,
                message: "Advisor assigned to department successfully",
                assignmentId: result.insertId
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    /**
     * Remove advisor assignment
     */
    removeAdvisorAssignment: async (userId) => {
        try {
            const [result] = await pool.query(
                "DELETE FROM advisor_assignments WHERE user_entity_id = ?",
                [userId]
            );

            if (result.affectedRows === 0) {
                return { success: false, message: "Advisor assignment not found" };
            }

            return { success: true, message: "Advisor assignment removed successfully" };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // ================= DEPARTMENT COURSES =================

    /**
     * Get all courses in a specific department
     */
    getDepartmentCourses: async (department) => {
        try {
            // Query courses where department attribute matches
            const [courses] = await pool.query(`
        SELECT 
          ce.entity_id AS id,
          ce.entity_name AS name,
          MAX(CASE WHEN ca.attribute_name = 'course_code' THEN cea.value_string END) AS code,
          MAX(CASE WHEN ca.attribute_name = 'course_name' THEN cea.value_string END) AS title,
          MAX(CASE WHEN ca.attribute_name = 'description' THEN cea.value_string END) AS description,
          MAX(CASE WHEN ca.attribute_name = 'credits' THEN cea.value_number END) AS credits,
          MAX(CASE WHEN ca.attribute_name = 'department' THEN cea.value_string END) AS department
        FROM course_entity ce
        LEFT JOIN course_entity_attribute cea ON ce.entity_id = cea.entity_id
        LEFT JOIN course_attributes ca ON cea.attribute_id = ca.attribute_id
        GROUP BY ce.entity_id, ce.entity_name
        HAVING department = ?
        ORDER BY code ASC
      `, [department]);

            return { success: true, data: courses };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // ================= DEPARTMENT STUDENTS =================

    /**
     * Get all students enrolled in courses within a department
     * This is the core advisor visibility query
     */
    getDepartmentStudents: async (department) => {
        try {
            // Complex query to find students enrolled in department courses
            const [students] = await pool.query(`
        SELECT DISTINCT
          e.entity_id AS id,
          e.entity_name AS name,
          MAX(CASE WHEN a.attribute_name = 'email' THEN ea.value_string END) AS email,
          MAX(CASE WHEN a.attribute_name = 'username' THEN ea.value_string END) AS username
        FROM entities e
        -- Join to get student attributes
        LEFT JOIN entity_attribute ea ON e.entity_id = ea.entity_id
        LEFT JOIN attributes a ON ea.attribute_id = a.attribute_id
        WHERE e.entity_type = 'student'
        AND e.entity_id IN (
          -- Subquery: Find students enrolled in courses of this department
          SELECT DISTINCT enr_student.value_reference AS student_id
          FROM enrollment_entity ee
          -- Get student ID from enrollment
          JOIN enrollment_entity_attribute enr_student ON ee.entity_id = enr_student.entity_id
          JOIN enrollment_attributes ea_student ON enr_student.attribute_id = ea_student.attribute_id AND ea_student.attribute_name = 'studentId'
          -- Get course ID from enrollment
          JOIN enrollment_entity_attribute enr_course ON ee.entity_id = enr_course.entity_id
          JOIN enrollment_attributes ea_course ON enr_course.attribute_id = ea_course.attribute_id AND ea_course.attribute_name = 'courseId'
          -- Get course department
          JOIN course_entity ce ON ce.entity_id = enr_course.value_reference
          JOIN course_entity_attribute cea ON ce.entity_id = cea.entity_id
          JOIN course_attributes ca ON cea.attribute_id = ca.attribute_id AND ca.attribute_name = 'department'
          -- Filter by department
          WHERE cea.value_string = ?
          -- Only active enrollments
          AND EXISTS (
            SELECT 1 FROM enrollment_entity_attribute ees
            JOIN enrollment_attributes eas ON ees.attribute_id = eas.attribute_id AND eas.attribute_name = 'status'
            WHERE ees.entity_id = ee.entity_id AND ees.value_string IN ('active', 'enrolled', 'pending')
          )
        )
        GROUP BY e.entity_id, e.entity_name
        ORDER BY e.entity_name ASC
      `, [department]);

            return { success: true, data: students };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    /**
     * Get detailed student info with their enrolled courses in the department
     */
    getStudentCoursesInDepartment: async (studentId, department) => {
        try {
            const [courses] = await pool.query(`
        SELECT 
          ce.entity_id AS courseId,
          MAX(CASE WHEN ca.attribute_name = 'course_code' THEN cea.value_string END) AS code,
          MAX(CASE WHEN ca.attribute_name = 'course_name' THEN cea.value_string END) AS title,
          MAX(CASE WHEN ca.attribute_name = 'credits' THEN cea.value_number END) AS credits,
          MAX(CASE WHEN eas.attribute_name = 'status' THEN ens.value_string END) AS enrollmentStatus,
          MAX(CASE WHEN eas.attribute_name = 'grade' THEN ens.value_number END) AS grade
        FROM enrollment_entity ee
        -- Get student reference
        JOIN enrollment_entity_attribute enr_student ON ee.entity_id = enr_student.entity_id
        JOIN enrollment_attributes ea_student ON enr_student.attribute_id = ea_student.attribute_id AND ea_student.attribute_name = 'studentId'
        -- Get course reference
        JOIN enrollment_entity_attribute enr_course ON ee.entity_id = enr_course.entity_id
        JOIN enrollment_attributes ea_course ON enr_course.attribute_id = ea_course.attribute_id AND ea_course.attribute_name = 'courseId'
        -- Get course details
        JOIN course_entity ce ON ce.entity_id = enr_course.value_reference
        JOIN course_entity_attribute cea ON ce.entity_id = cea.entity_id
        JOIN course_attributes ca ON cea.attribute_id = ca.attribute_id
        -- Get enrollment status/grade
        LEFT JOIN enrollment_entity_attribute ens ON ee.entity_id = ens.entity_id
        LEFT JOIN enrollment_attributes eas ON ens.attribute_id = eas.attribute_id
        WHERE enr_student.value_reference = ?
        AND EXISTS (
          SELECT 1 FROM course_entity_attribute cea2
          JOIN course_attributes ca2 ON cea2.attribute_id = ca2.attribute_id AND ca2.attribute_name = 'department'
          WHERE cea2.entity_id = ce.entity_id AND cea2.value_string = ?
        )
        GROUP BY ce.entity_id
        ORDER BY code ASC
      `, [studentId, department]);

            return { success: true, data: courses };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // ================= STATISTICS =================

    /**
     * Get advisor dashboard statistics
     */
    getDepartmentStats: async (department) => {
        try {
            // Get course count
            const coursesResult = await advisorService.getDepartmentCourses(department);
            const courseCount = coursesResult.success ? coursesResult.data.length : 0;

            // Get student count
            const studentsResult = await advisorService.getDepartmentStudents(department);
            const studentCount = studentsResult.success ? studentsResult.data.length : 0;

            return {
                success: true,
                data: {
                    department,
                    totalCourses: courseCount,
                    totalStudents: studentCount
                }
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
};

module.exports = advisorService;
