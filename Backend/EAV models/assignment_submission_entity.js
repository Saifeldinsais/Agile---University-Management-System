const pool = require('../Db_config/DB');

const AssignmentSubmissionEntity = {
  create: async (student_id, assignment_id) => {
    const [result] = await pool.query(
      "INSERT INTO assignment_submission_entity (student_id, assignment_id, status) VALUES (?, ?, 'submitted')",
      [student_id, assignment_id]
    );
    return result.insertId;
  },

  findById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM assignment_submission_entity WHERE id = ?",
      [id]
    );
    return rows[0];
  },

  findByStudentAndAssignment: async (student_id, assignment_id) => {
    const [rows] = await pool.query(
      "SELECT * FROM assignment_submission_entity WHERE student_id = ? AND assignment_id = ?",
      [student_id, assignment_id]
    );
    return rows[0] || null;
  },

  findByStudent: async (student_id) => {
    const [rows] = await pool.query(
      "SELECT * FROM assignment_submission_entity WHERE student_id = ? ORDER BY submitted_at DESC",
      [student_id]
    );
    return rows;
  },

  findByAssignment: async (assignment_id) => {
    const [rows] = await pool.query(
      "SELECT * FROM assignment_submission_entity WHERE assignment_id = ? ORDER BY submitted_at DESC",
      [assignment_id]
    );
    return rows;
  },

  update: async (id) => {
    const [result] = await pool.query(
      "UPDATE assignment_submission_entity SET submitted_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = AssignmentSubmissionEntity;
