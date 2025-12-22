const pool = require('../Db_config/DB');
const EnrollmentAttribute = require('../EAV models/enrollment_attribute');
const EnrollmentValue = require('../EAV models/enrollment_value');

let attrsInitialized = false;

/**
 * Initialize enrollment attributes (ensure they exist)
 */
const initEnrollmentAttrs = async () => {
    if (attrsInitialized) return;

    const ensure = async (name, type) => {
        const attr = await EnrollmentAttribute.getAttributeByName(name);
        if (!attr) await EnrollmentAttribute.createEnrollmentAttribute(name, type);
    };

    await ensure('studentId', 'int');
    await ensure('courseId', 'int');
    await ensure('status', 'string');
    await ensure('grade', 'float');
    await ensure('advisorId', 'int');
    await ensure('decisionByRole', 'string');
    await ensure('decisionById', 'int');
    await ensure('decisionNote', 'string');
    await ensure('departmentId', 'string');

    attrsInitialized = true;
};

/**
 * Get attribute ID by name
 */
const getAttrId = async (name) => {
    const attr = await EnrollmentAttribute.getAttributeByName(name);
    return attr ? attr.attribute_id : null;
};

const AdminEnrollmentsService = {
    /**
     * Get all enrollment requests with filters
     * @param {Object} filters - { status, department, search }
     */
    getEnrollments: async (filters = {}) => {
        try {
            await initEnrollmentAttrs();

            const studentAttrId = await getAttrId('studentId');
            const courseAttrId = await getAttrId('courseId');
            const statusAttrId = await getAttrId('status');
            const advisorAttrId = await getAttrId('advisorId');
            const noteAttrId = await getAttrId('decisionNote');
            const deptAttrId = await getAttrId('departmentId');

            // Get all enrollments with their values
            const [enrollments] = await pool.query(`
        SELECT 
          ee.entity_id AS id,
          ee.entity_name,
          ee.created_at,
          vStudent.value_number AS studentId,
          vCourse.value_number AS courseId,
          vStatus.value_string AS status,
          vAdvisor.value_number AS advisorId,
          vNote.value_string AS decisionNote,
          vDept.value_string AS departmentId
        FROM enrollment_entity ee
        LEFT JOIN enrollment_entity_attribute vStudent 
          ON vStudent.entity_id = ee.entity_id AND vStudent.attribute_id = ?
        LEFT JOIN enrollment_entity_attribute vCourse 
          ON vCourse.entity_id = ee.entity_id AND vCourse.attribute_id = ?
        LEFT JOIN enrollment_entity_attribute vStatus 
          ON vStatus.entity_id = ee.entity_id AND vStatus.attribute_id = ?
        LEFT JOIN enrollment_entity_attribute vAdvisor 
          ON vAdvisor.entity_id = ee.entity_id AND vAdvisor.attribute_id = ?
        LEFT JOIN enrollment_entity_attribute vNote 
          ON vNote.entity_id = ee.entity_id AND vNote.attribute_id = ?
        LEFT JOIN enrollment_entity_attribute vDept 
          ON vDept.entity_id = ee.entity_id AND vDept.attribute_id = ?
        ORDER BY ee.created_at DESC
      `, [studentAttrId, courseAttrId, statusAttrId, advisorAttrId, noteAttrId, deptAttrId]);

            // Get student info - convert IDs to integers (they come back as strings like "6.0000")
            const studentIds = [...new Set(enrollments.map(e => parseInt(e.studentId)).filter(id => !isNaN(id) && id > 0))];
            const courseIds = [...new Set(enrollments.map(e => parseInt(e.courseId)).filter(id => !isNaN(id) && id > 0))];
            const advisorIds = [...new Set(enrollments.map(e => parseInt(e.advisorId)).filter(id => !isNaN(id) && id > 0))];

            console.log('DEBUG - Student IDs:', studentIds);
            console.log('DEBUG - Course IDs:', courseIds);

            // Fetch student details from entities table (users are stored here)
            let studentsMap = {};
            if (studentIds.length) {
                const [students] = await pool.query(`
          SELECT 
            e.entity_id AS id,
            e.entity_name AS entityName,
            MAX(CASE WHEN a.attribute_name = 'email' THEN ea.value_string END) AS email,
            MAX(CASE WHEN a.attribute_name = 'username' THEN ea.value_string END) AS username
          FROM entities e
          LEFT JOIN entity_attribute ea ON ea.entity_id = e.entity_id
          LEFT JOIN attributes a ON a.attribute_id = ea.attribute_id
          WHERE e.entity_id IN (${studentIds.join(',')})
          GROUP BY e.entity_id, e.entity_name
        `);
                console.log('DEBUG - Found students:', students);
                students.forEach(s => { studentsMap[s.id] = s; });
            }

            // Fetch course details from course_entity
            let coursesMap = {};
            if (courseIds.length) {
                const [courses] = await pool.query(`
          SELECT 
            ce.entity_id AS id,
            ce.entity_name AS entityName,
            MAX(CASE WHEN ca.attribute_name = 'title' THEN cea.value_string END) AS title,
            MAX(CASE WHEN ca.attribute_name = 'code' THEN cea.value_string END) AS code,
            MAX(CASE WHEN ca.attribute_name = 'department' THEN cea.value_string END) AS department
          FROM course_entity ce
          LEFT JOIN course_entity_attribute cea ON cea.entity_id = ce.entity_id
          LEFT JOIN course_attributes ca ON ca.attribute_id = cea.attribute_id
          WHERE ce.entity_id IN (${courseIds.join(',')})
          GROUP BY ce.entity_id, ce.entity_name
        `);
                courses.forEach(c => { coursesMap[c.id] = c; });
            }

            // Fetch advisor details from staff
            let advisorsMap = {};
            if (advisorIds.length) {
                const [advisors] = await pool.query(`
          SELECT 
            se.entity_id AS id,
            MAX(CASE WHEN sa.attribute_name = 'email' THEN sea.value_string END) AS email,
            MAX(CASE WHEN sa.attribute_name = 'name' THEN sea.value_string END) AS name,
            MAX(CASE WHEN sa.attribute_name = 'department' THEN sea.value_string END) AS department
          FROM staff_entity se
          LEFT JOIN staff_entity_attribute sea ON sea.entity_id = se.entity_id
          LEFT JOIN staff_attributes sa ON sa.attribute_id = sea.attribute_id
          WHERE se.entity_id IN (${advisorIds.join(',')})
          GROUP BY se.entity_id
        `);
                advisors.forEach(a => { advisorsMap[a.id] = a; });
            }

            // Build enriched enrollment list
            let result = enrollments.map(enr => {
                // Convert IDs to int for map lookup (they come as strings like "6.0000")
                const studentIdInt = parseInt(enr.studentId);
                const courseIdInt = parseInt(enr.courseId);
                const advisorIdInt = parseInt(enr.advisorId);

                const student = studentsMap[studentIdInt] || { username: null, entityName: null, email: '' };
                const course = coursesMap[courseIdInt] || { title: null, entityName: null, code: '', department: '' };
                const advisor = advisorsMap[advisorIdInt] || null;

                // Get display name: prefer username, then entityName, then email
                const studentDisplayName = student.username || student.entityName || student.email || 'Unknown';
                // Get course title: prefer title attribute, then entity name
                const courseDisplayTitle = course.title || course.entityName || 'Unknown';

                return {
                    id: enr.id,
                    studentId: studentIdInt || enr.studentId,
                    studentName: studentDisplayName,
                    studentEmail: student.email || '',
                    courseId: courseIdInt || enr.courseId,
                    courseTitle: courseDisplayTitle,
                    courseCode: course.code || '',
                    department: enr.departmentId || course.department || '',
                    advisor: advisor ? { id: advisor.id, name: advisor.name || advisor.entityName, email: advisor.email } : null,
                    status: (enr.status || 'pending').toUpperCase(),
                    decisionNote: enr.decisionNote || '',
                    createdAt: enr.created_at
                };
            });

            // Apply filters - only if status is provided and not 'ALL'
            if (filters.status && filters.status.toUpperCase() !== 'ALL') {
                result = result.filter(e => e.status === filters.status.toUpperCase());
            }

            if (filters.department) {
                result = result.filter(e =>
                    e.department?.toLowerCase().includes(filters.department.toLowerCase())
                );
            }

            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                result = result.filter(e =>
                    e.studentName?.toLowerCase().includes(searchLower) ||
                    e.studentEmail?.toLowerCase().includes(searchLower) ||
                    e.courseTitle?.toLowerCase().includes(searchLower) ||
                    e.courseCode?.toLowerCase().includes(searchLower)
                );
            }

            return { success: true, data: result };
        } catch (error) {
            console.error('Error fetching enrollments:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Assign an advisor to an enrollment request
     */
    assignAdvisor: async (enrollmentId, advisorId) => {
        try {
            await initEnrollmentAttrs();

            const advisorAttrId = await getAttrId('advisorId');

            // Check if enrollment exists
            const [enr] = await pool.query(
                'SELECT entity_id FROM enrollment_entity WHERE entity_id = ?',
                [enrollmentId]
            );
            if (!enr.length) {
                return { success: false, message: 'Enrollment not found' };
            }

            // Upsert advisor value
            const existing = await EnrollmentValue.getEnrollmentValue(enrollmentId, advisorAttrId);
            if (existing) {
                await EnrollmentValue.updateEnrollmentValue(existing.value_id, { value_number: advisorId });
            } else {
                await EnrollmentValue.createEnrollmentValue(enrollmentId, advisorAttrId, { value_number: advisorId });
            }

            return { success: true, message: 'Advisor assigned successfully' };
        } catch (error) {
            console.error('Error assigning advisor:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Decide on an enrollment (approve/reject)
     */
    decideEnrollment: async (enrollmentId, action, note, decisionBy) => {
        try {
            await initEnrollmentAttrs();

            const statusAttrId = await getAttrId('status');
            const noteAttrId = await getAttrId('decisionNote');
            const decisionByRoleAttrId = await getAttrId('decisionByRole');
            const decisionByIdAttrId = await getAttrId('decisionById');

            // Check if enrollment exists
            const [enr] = await pool.query(
                'SELECT entity_id FROM enrollment_entity WHERE entity_id = ?',
                [enrollmentId]
            );
            if (!enr.length) {
                return { success: false, message: 'Enrollment not found' };
            }

            // Validate action
            const normalizedAction = action.toUpperCase();
            if (!['APPROVE', 'REJECT'].includes(normalizedAction)) {
                return { success: false, message: 'Invalid action. Must be APPROVE or REJECT' };
            }

            const newStatus = normalizedAction === 'APPROVE' ? 'APPROVED' : 'REJECTED';

            // Update status
            const statusVal = await EnrollmentValue.getEnrollmentValue(enrollmentId, statusAttrId);
            if (statusVal) {
                await EnrollmentValue.updateEnrollmentValue(statusVal.value_id, { value_string: newStatus });
            } else {
                await EnrollmentValue.createEnrollmentValue(enrollmentId, statusAttrId, { value_string: newStatus });
            }

            // Store decision note (for rejection)
            if (note) {
                const noteVal = await EnrollmentValue.getEnrollmentValue(enrollmentId, noteAttrId);
                if (noteVal) {
                    await EnrollmentValue.updateEnrollmentValue(noteVal.value_id, { value_string: note });
                } else {
                    await EnrollmentValue.createEnrollmentValue(enrollmentId, noteAttrId, { value_string: note });
                }
            }

            // Store who made the decision
            if (decisionBy) {
                // Role
                const roleVal = await EnrollmentValue.getEnrollmentValue(enrollmentId, decisionByRoleAttrId);
                if (roleVal) {
                    await EnrollmentValue.updateEnrollmentValue(roleVal.value_id, { value_string: decisionBy.role });
                } else {
                    await EnrollmentValue.createEnrollmentValue(enrollmentId, decisionByRoleAttrId, { value_string: decisionBy.role });
                }

                // ID
                const idVal = await EnrollmentValue.getEnrollmentValue(enrollmentId, decisionByIdAttrId);
                if (idVal) {
                    await EnrollmentValue.updateEnrollmentValue(idVal.value_id, { value_number: decisionBy.id });
                } else {
                    await EnrollmentValue.createEnrollmentValue(enrollmentId, decisionByIdAttrId, { value_number: decisionBy.id });
                }
            }

            return {
                success: true,
                message: `Enrollment ${newStatus.toLowerCase()} successfully`,
                status: newStatus
            };
        } catch (error) {
            console.error('Error deciding enrollment:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Get a single enrollment by ID with full details
     */
    getEnrollmentById: async (enrollmentId) => {
        try {
            await initEnrollmentAttrs();

            const studentAttrId = await getAttrId('studentId');
            const courseAttrId = await getAttrId('courseId');
            const statusAttrId = await getAttrId('status');
            const advisorAttrId = await getAttrId('advisorId');
            const noteAttrId = await getAttrId('decisionNote');

            const [rows] = await pool.query(`
        SELECT 
          ee.entity_id AS id,
          ee.entity_name,
          ee.created_at,
          vStudent.value_number AS studentId,
          vCourse.value_number AS courseId,
          vStatus.value_string AS status,
          vAdvisor.value_number AS advisorId,
          vNote.value_string AS decisionNote
        FROM enrollment_entity ee
        LEFT JOIN enrollment_entity_attribute vStudent 
          ON vStudent.entity_id = ee.entity_id AND vStudent.attribute_id = ?
        LEFT JOIN enrollment_entity_attribute vCourse 
          ON vCourse.entity_id = ee.entity_id AND vCourse.attribute_id = ?
        LEFT JOIN enrollment_entity_attribute vStatus 
          ON vStatus.entity_id = ee.entity_id AND vStatus.attribute_id = ?
        LEFT JOIN enrollment_entity_attribute vAdvisor 
          ON vAdvisor.entity_id = ee.entity_id AND vAdvisor.attribute_id = ?
        LEFT JOIN enrollment_entity_attribute vNote 
          ON vNote.entity_id = ee.entity_id AND vNote.attribute_id = ?
        WHERE ee.entity_id = ?
      `, [studentAttrId, courseAttrId, statusAttrId, advisorAttrId, noteAttrId, enrollmentId]);

            if (!rows.length) {
                return { success: false, message: 'Enrollment not found' };
            }

            return { success: true, data: rows[0] };
        } catch (error) {
            console.error('Error fetching enrollment:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Get all departments (for filter dropdown)
     */
    getDepartments: async () => {
        try {
            const [rows] = await pool.query(`
        SELECT DISTINCT cea.value_string AS department
        FROM course_entity_attribute cea
        JOIN course_attributes ca ON ca.attribute_id = cea.attribute_id
        WHERE ca.attribute_name = 'department' AND cea.value_string IS NOT NULL
        ORDER BY cea.value_string
      `);

            return { success: true, data: rows.map(r => r.department) };
        } catch (error) {
            console.error('Error fetching departments:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Get all advisors (optionally filtered by department)
     */
    getAdvisors: async (department = null) => {
        try {
            let query = `
        SELECT 
          se.entity_id AS id,
          MAX(CASE WHEN sa.attribute_name = 'email' THEN sea.value_string END) AS email,
          MAX(CASE WHEN sa.attribute_name = 'name' THEN sea.value_string END) AS name,
          MAX(CASE WHEN sa.attribute_name = 'department' THEN sea.value_string END) AS department,
          MAX(CASE WHEN sa.attribute_name = 'type' THEN sea.value_string END) AS type
        FROM staff_entity se
        LEFT JOIN staff_entity_attribute sea ON sea.entity_id = se.entity_id
        LEFT JOIN staff_attributes sa ON sa.attribute_id = sea.attribute_id
        GROUP BY se.entity_id
        HAVING type IN ('professor', 'advisor', 'doctor')
      `;

            const [rows] = await pool.query(query);

            let advisors = rows;
            if (department) {
                advisors = rows.filter(a =>
                    a.department?.toLowerCase() === department.toLowerCase()
                );
            }

            return { success: true, data: advisors };
        } catch (error) {
            console.error('Error fetching advisors:', error);
            return { success: false, message: error.message };
        }
    }
};

module.exports = AdminEnrollmentsService;
