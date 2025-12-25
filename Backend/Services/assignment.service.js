const pool = require('../Db_config/DB');
const AssignmentEntity = require('../EAV models/assignment_entity');
const AssignmentAttribute = require('../EAV models/assignment_attribute');
const AssignmentValue = require('../EAV models/assignment_value');

let attrsInitialized = false;

/**
 * Initialize assignment attributes (ensure they exist)
 */
const initAssignmentAttrs = async () => {
  if (attrsInitialized) return;

  const attrs = [
    { name: 'role', type: 'string' },           // 'doctor', 'instructor', or 'ta'
    { name: 'department', type: 'string' },
    { name: 'status', type: 'string' },         // 'active', 'inactive'
    { name: 'assigned_date', type: 'datetime' },
    { name: 'notes', type: 'text' },
  ];

  for (const attr of attrs) {
    await AssignmentAttribute.createIfNotExists(attr.name, attr.type);
  }

  attrsInitialized = true;
};

/**
 * Get attribute ID by name
 */
const getAttrId = async (name) => {
  const attr = await AssignmentAttribute.getAttributeByName(name);
  return attr ? attr.attribute_id : null;
};

/**
 * Upsert an assignment attribute value
 */
const upsertValue = async (entityId, attrId, value) => {
  const existing = await AssignmentValue.getAssignmentValue(entityId, attrId);

  if (existing) {
    await AssignmentValue.updateAssignmentValue(entityId, attrId, {
      value_string: value,
    });
  } else {
    await AssignmentValue.createAssignmentValue(entityId, attrId, {
      value_string: value,
    });
  }
};

const AssignmentService = {
  /**
   * Assign a staff member to a course with a specific role
   */
  assignStaffToCourse: async ({
    courseId,
    staffId,
    role,
    department,
    notes = '',
  }) => {
    try {
      await initAssignmentAttrs();

      if (!courseId || !staffId || !role) {
        return {
          success: false,
          message: 'courseId, staffId, and role are required',
        };
      }

      if (!['doctor', 'instructor', 'ta'].includes(role.toLowerCase())) {
        return {
          success: false,
          message: 'Role must be either "doctor", "instructor", or "ta"',
        };
      }

      // Check if assignment already exists
      const existing = await pool.query(
        'SELECT * FROM assignment_entity WHERE course_id = ? AND staff_id = ?',
        [courseId, staffId]
      );
      if (existing[0].length > 0) {
        return {
          success: false,
          message: 'Staff member is already assigned to this course',
        };
      }

      // Create assignment entity with course and staff IDs
      const assignmentId = await AssignmentEntity.createAssignment(
        'assignment',
        `Assignment_${courseId}_${staffId}`,
        courseId,
        staffId
      );

      // Set attributes
      const roleAttrId = await getAttrId('role');
      const deptAttrId = await getAttrId('department');
      const statusAttrId = await getAttrId('status');
      const notesAttrId = await getAttrId('notes');

      await upsertValue(assignmentId, roleAttrId, role.toLowerCase());
      if (department) {
        await upsertValue(assignmentId, deptAttrId, department);
      }
      await upsertValue(assignmentId, statusAttrId, 'active');
      if (notes) {
        await upsertValue(assignmentId, notesAttrId, notes);
      }

      return {
        success: true,
        id: assignmentId,
        message: `${role} successfully assigned to course`,
      };
    } catch (error) {
      console.error('Error assigning staff to course:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Get all assignments for a course with staff details
   */
  getAssignmentsByCourse: async (courseId) => {
    try {
      await initAssignmentAttrs();

      const roleAttrId = await getAttrId('role');
      const deptAttrId = await getAttrId('department');
      const statusAttrId = await getAttrId('status');
      const notesAttrId = await getAttrId('notes');

      // Get assignments with staff and course info
      const [assignments] = await pool.query(
        `
        SELECT 
          ae.entity_id,
          ae.course_id,
          ae.staff_id,
          ae.created_at,
          ae.updated_at,
          vRole.value_string AS role,
          vDept.value_string AS department,
          vStatus.value_string AS status,
          vNotes.value_string AS notes,
          -- Get staff details
          se.entity_name AS staff_name,
          sName.value_string AS staff_full_name,
          sEmail.value_string AS staff_email,
          sDept.value_string AS staff_department,
          sRole.value_string AS staff_role,
          -- Get course details
          ce.entity_name AS course_name,
          cCode.value_string AS course_code,
          cTitle.value_string AS course_title
        FROM assignment_entity ae
        LEFT JOIN assignment_entity_attribute vRole ON vRole.entity_id = ae.entity_id AND vRole.attribute_id = ?
        LEFT JOIN assignment_entity_attribute vDept ON vDept.entity_id = ae.entity_id AND vDept.attribute_id = ?
        LEFT JOIN assignment_entity_attribute vStatus ON vStatus.entity_id = ae.entity_id AND vStatus.attribute_id = ?
        LEFT JOIN assignment_entity_attribute vNotes ON vNotes.entity_id = ae.entity_id AND vNotes.attribute_id = ?
        LEFT JOIN staff_entity se ON se.entity_id = ae.staff_id
        LEFT JOIN staff_entity_attribute sName ON sName.entity_id = se.entity_id AND sName.attribute_id = (SELECT attribute_id FROM staff_attributes WHERE attribute_name = 'name' LIMIT 1)
        LEFT JOIN staff_entity_attribute sEmail ON sEmail.entity_id = se.entity_id AND sEmail.attribute_id = (SELECT attribute_id FROM staff_attributes WHERE attribute_name = 'email' LIMIT 1)
        LEFT JOIN staff_entity_attribute sDept ON sDept.entity_id = se.entity_id AND sDept.attribute_id = (SELECT attribute_id FROM staff_attributes WHERE attribute_name = 'department' LIMIT 1)
        LEFT JOIN staff_entity_attribute sRole ON sRole.entity_id = se.entity_id AND sRole.attribute_id = (SELECT attribute_id FROM staff_attributes WHERE attribute_name = 'role' LIMIT 1)
        LEFT JOIN course_entity ce ON ce.entity_id = ae.course_id
        LEFT JOIN course_entity_attribute cCode ON cCode.entity_id = ce.entity_id AND cCode.attribute_id = (SELECT attribute_id FROM course_attributes WHERE attribute_name = 'code' LIMIT 1)
        LEFT JOIN course_entity_attribute cTitle ON cTitle.entity_id = ce.entity_id AND cTitle.attribute_id = (SELECT attribute_id FROM course_attributes WHERE attribute_name = 'title' LIMIT 1)
        WHERE ae.course_id = ?
        ORDER BY ae.created_at DESC
        `,
        [roleAttrId, deptAttrId, statusAttrId, notesAttrId, courseId]
      );

      const result = assignments.map((a) => ({
        id: a.entity_id,
        courseId: a.course_id,
        staffId: a.staff_id,
        role: a.role || 'unknown',
        department: a.department || '',
        status: a.status || 'active',
        notes: a.notes || '',
        createdAt: a.created_at,
        updatedAt: a.updated_at,
        staff: {
          id: a.staff_id,
          name: a.staff_full_name || a.staff_name || 'Unknown',
          email: a.staff_email || '',
          department: a.staff_department || '',
          role: a.staff_role || '',
        },
        course: {
          id: a.course_id,
          name: a.course_title || a.course_name || 'Unknown',
          code: a.course_code || '',
        },
      }));

      return { success: true, data: result };
    } catch (error) {
      console.error('Error fetching assignments:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Get all assignments for a staff member
   */
  getAssignmentsByStaff: async (staffId) => {
    try {
      await initAssignmentAttrs();

      const roleAttrId = await getAttrId('role');
      const deptAttrId = await getAttrId('department');
      const statusAttrId = await getAttrId('status');

      const [assignments] = await pool.query(
        `
        SELECT 
          ae.entity_id,
          ae.course_id,
          ae.staff_id,
          vRole.value_string AS role,
          vDept.value_string AS department,
          vStatus.value_string AS status,
          se.entity_name AS staff_name,
          ce.entity_name AS course_name,
          cCode.value_string AS course_code,
          cTitle.value_string AS course_title,
          ae.created_at
        FROM assignment_entity ae
        LEFT JOIN assignment_entity_attribute vRole ON vRole.entity_id = ae.entity_id AND vRole.attribute_id = ?
        LEFT JOIN assignment_entity_attribute vDept ON vDept.entity_id = ae.entity_id AND vDept.attribute_id = ?
        LEFT JOIN assignment_entity_attribute vStatus ON vStatus.entity_id = ae.entity_id AND vStatus.attribute_id = ?
        LEFT JOIN staff_entity se ON se.entity_id = ae.staff_id
        LEFT JOIN course_entity ce ON ce.entity_id = ae.course_id
        LEFT JOIN course_entity_attribute cCode ON cCode.entity_id = ce.entity_id AND cCode.attribute_id = (SELECT attribute_id FROM course_attributes WHERE attribute_name = 'code' LIMIT 1)
        LEFT JOIN course_entity_attribute cTitle ON cTitle.entity_id = ce.entity_id AND cTitle.attribute_id = (SELECT attribute_id FROM course_attributes WHERE attribute_name = 'title' LIMIT 1)
        WHERE ae.staff_id = ?
        ORDER BY ae.created_at DESC
        `,
        [roleAttrId, deptAttrId, statusAttrId, staffId]
      );

      const result = assignments.map((a) => ({
        id: a.entity_id,
        courseId: a.course_id,
        staffId: a.staff_id,
        role: a.role || 'unknown',
        department: a.department || '',
        status: a.status || 'active',
        courseName: a.course_title || a.course_name || 'Unknown',
        courseCode: a.course_code || '',
        createdAt: a.created_at,
      }));

      return { success: true, data: result };
    } catch (error) {
      console.error('Error fetching staff assignments:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Get all assignments with optional filters
   */
  getAllAssignments: async (filters = {}) => {
    try {
      await initAssignmentAttrs();

      const roleAttrId = await getAttrId('role');
      const deptAttrId = await getAttrId('department');
      const statusAttrId = await getAttrId('status');

      let query = `
        SELECT 
          ae.entity_id,
          ae.course_id,
          ae.staff_id,
          vRole.value_string AS role,
          vDept.value_string AS department,
          vStatus.value_string AS status,
          se.entity_name AS staff_name,
          sName.value_string AS staff_full_name,
          sEmail.value_string AS staff_email,
          ce.entity_name AS course_name,
          cCode.value_string AS course_code,
          cTitle.value_string AS course_title,
          ae.created_at
        FROM assignment_entity ae
        LEFT JOIN assignment_entity_attribute vRole ON vRole.entity_id = ae.entity_id AND vRole.attribute_id = ?
        LEFT JOIN assignment_entity_attribute vDept ON vDept.entity_id = ae.entity_id AND vDept.attribute_id = ?
        LEFT JOIN assignment_entity_attribute vStatus ON vStatus.entity_id = ae.entity_id AND vStatus.attribute_id = ?
        LEFT JOIN staff_entity se ON se.entity_id = ae.staff_id
        LEFT JOIN staff_entity_attribute sName ON sName.entity_id = se.entity_id AND sName.attribute_id = (SELECT attribute_id FROM staff_attributes WHERE attribute_name = 'name' LIMIT 1)
        LEFT JOIN staff_entity_attribute sEmail ON sEmail.entity_id = se.entity_id AND sEmail.attribute_id = (SELECT attribute_id FROM staff_attributes WHERE attribute_name = 'email' LIMIT 1)
        LEFT JOIN course_entity ce ON ce.entity_id = ae.course_id
        LEFT JOIN course_entity_attribute cCode ON cCode.entity_id = ce.entity_id AND cCode.attribute_id = (SELECT attribute_id FROM course_attributes WHERE attribute_name = 'code' LIMIT 1)
        LEFT JOIN course_entity_attribute cTitle ON cTitle.entity_id = ce.entity_id AND cTitle.attribute_id = (SELECT attribute_id FROM course_attributes WHERE attribute_name = 'title' LIMIT 1)
        WHERE 1=1
      `;

      const params = [roleAttrId, deptAttrId, statusAttrId];

      if (filters.courseId) {
        query += ' AND ae.course_id = ?';
        params.push(filters.courseId);
      }

      if (filters.staffId) {
        query += ' AND ae.staff_id = ?';
        params.push(filters.staffId);
      }

      if (filters.role) {
        query += ' AND vRole.value_string = ?';
        params.push(filters.role.toLowerCase());
      }

      if (filters.status) {
        query += ' AND vStatus.value_string = ?';
        params.push(filters.status);
      }

      query += ' ORDER BY ae.created_at DESC';

      const [assignments] = await pool.query(query, params);

      const result = assignments.map((a) => ({
        id: a.entity_id,
        courseId: a.course_id,
        staffId: a.staff_id,
        role: a.role || 'unknown',
        department: a.department || '',
        status: a.status || 'active',
        staffName: a.staff_full_name || a.staff_name || 'Unknown',
        staffEmail: a.staff_email || '',
        courseName: a.course_title || a.course_name || 'Unknown',
        courseCode: a.course_code || '',
        createdAt: a.created_at,
      }));

      return { success: true, data: result };
    } catch (error) {
      console.error('Error fetching all assignments:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Update an assignment
   */
  updateAssignment: async (assignmentId, { role, status, notes, department }) => {
    try {
      await initAssignmentAttrs();

      const assignment = await AssignmentEntity.getAssignmentById(assignmentId);
      if (!assignment) {
        return { success: false, message: 'Assignment not found' };
      }

      if (role && !['instructor', 'ta'].includes(role.toLowerCase())) {
        return {
          success: false,
          message: 'Role must be either "instructor" or "ta"',
        };
      }

      const roleAttrId = await getAttrId('role');
      const statusAttrId = await getAttrId('status');
      const notesAttrId = await getAttrId('notes');
      const deptAttrId = await getAttrId('department');

      if (role) {
        await upsertValue(assignmentId, roleAttrId, role.toLowerCase());
      }
      if (status) {
        await upsertValue(assignmentId, statusAttrId, status);
      }
      if (notes) {
        await upsertValue(assignmentId, notesAttrId, notes);
      }
      if (department) {
        await upsertValue(assignmentId, deptAttrId, department);
      }

      return { success: true, message: 'Assignment updated successfully' };
    } catch (error) {
      console.error('Error updating assignment:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Remove an assignment
   */
  removeAssignment: async (assignmentId) => {
    try {
      const assignment = await AssignmentEntity.getAssignmentById(assignmentId);
      if (!assignment) {
        return { success: false, message: 'Assignment not found' };
      }

      const deleted = await AssignmentEntity.deleteAssignment(assignmentId);
      if (!deleted) {
        return { success: false, message: 'Failed to remove assignment' };
      }

      return { success: true, message: 'Assignment removed successfully' };
    } catch (error) {
      console.error('Error removing assignment:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Get assignment by ID
   */
  getAssignmentById: async (assignmentId) => {
    try {
      await initAssignmentAttrs();

      const roleAttrId = await getAttrId('role');
      const deptAttrId = await getAttrId('department');
      const statusAttrId = await getAttrId('status');
      const notesAttrId = await getAttrId('notes');

      const [result] = await pool.query(
        `
        SELECT 
          ae.entity_id,
          ae.course_id,
          ae.staff_id,
          vRole.value_string AS role,
          vDept.value_string AS department,
          vStatus.value_string AS status,
          vNotes.value_string AS notes,
          ae.created_at
        FROM assignment_entity ae
        LEFT JOIN assignment_entity_attribute vRole ON vRole.entity_id = ae.entity_id AND vRole.attribute_id = ?
        LEFT JOIN assignment_entity_attribute vDept ON vDept.entity_id = ae.entity_id AND vDept.attribute_id = ?
        LEFT JOIN assignment_entity_attribute vStatus ON vStatus.entity_id = ae.entity_id AND vStatus.attribute_id = ?
        LEFT JOIN assignment_entity_attribute vNotes ON vNotes.entity_id = ae.entity_id AND vNotes.attribute_id = ?
        WHERE ae.entity_id = ?
        `,
        [roleAttrId, deptAttrId, statusAttrId, notesAttrId, assignmentId]
      );

      if (!result || result.length === 0) {
        return { success: false, message: 'Assignment not found' };
      }

      const a = result[0];
      return {
        success: true,
        data: {
          id: a.entity_id,
          courseId: a.course_id,
          staffId: a.staff_id,
          role: a.role || 'unknown',
          department: a.department || '',
          status: a.status || 'active',
          notes: a.notes || '',
          createdAt: a.created_at,
        },
      };
    } catch (error) {
      console.error('Error fetching assignment:', error);
      return { success: false, message: error.message };
    }
  },
};

module.exports = AssignmentService;
