const pool = require("../Db_config/DB");

const EnrollmentEntity = {
  createEnrollment: async (entity_type, entity_name) => {
    const [result] = await pool.query(
      "INSERT INTO enrollment_entity (entity_type, entity_name) VALUES (?, ?)",
      [entity_type, entity_name]
    );
    return result.insertId;
  },

  getEnrollmentById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM enrollment_entity WHERE entity_id = ?",
      [id]
    );
    return rows[0] || null;
  },

  deleteEnrollment: async (id) => {
    const [result] = await pool.query(
      "DELETE FROM enrollment_entity WHERE entity_id = ?",
      [id]
    );
    return result.affectedRows > 0;
  },
};

module.exports = EnrollmentEntity;
