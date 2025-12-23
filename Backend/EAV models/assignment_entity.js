const pool = require("../Db_config/DB");

const AssignmentEntity = {
  createAssignment: async (entity_type, entity_name, courseId = null, staffId = null) => {
    const [result] = await pool.query(
      "INSERT INTO assignment_entity (entity_type, entity_name, course_id, staff_id) VALUES (?, ?, ?, ?)",
      [entity_type, entity_name, courseId, staffId]
    );
    return result.insertId;
  },

  getAssignmentById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM assignment_entity WHERE entity_id = ?",
      [id]
    );
    return rows[0] || null;
  },

  getAllAssignments: async () => {
    const [rows] = await pool.query("SELECT * FROM assignment_entity");
    return rows;
  },

  getAssignmentsByCourse: async (courseId) => {
    const [rows] = await pool.query(
      "SELECT * FROM assignment_entity WHERE course_id = ?",
      [courseId]
    );
    return rows;
  },

  getAssignmentsByStaff: async (staffId) => {
    const [rows] = await pool.query(
      "SELECT * FROM assignment_entity WHERE staff_id = ?",
      [staffId]
    );
    return rows;
  },

  updateAssignment: async (id, entity_name) => {
    const [result] = await pool.query(
      "UPDATE assignment_entity SET entity_name = ? WHERE entity_id = ?",
      [entity_name, id]
    );
    return result.affectedRows > 0;
  },

  deleteAssignment: async (id) => {
    const [result] = await pool.query(
      "DELETE FROM assignment_entity WHERE entity_id = ?",
      [id]
    );
    return result.affectedRows > 0;
  },

  // Check if assignment already exists
  findExisting: async (courseId, staffId, role) => {
    const [rows] = await pool.query(
      `SELECT ae.* FROM assignment_entity ae
       JOIN assignment_entity_attribute aea ON ae.entity_id = aea.entity_id
       WHERE ae.course_id = ? AND ae.staff_id = ?`,
      [courseId, staffId]
    );
    return rows[0] || null;
  },
};

module.exports = AssignmentEntity;
