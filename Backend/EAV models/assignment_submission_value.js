const pool = require("../Db_config/DB");

const AssignmentSubmissionValue = {
  getValue: async (entity_id, attribute_id) => {
    const [rows] = await pool.query(
      "SELECT value_id, value_string, value_number, value_datetime, created_at FROM assignment_submission_entity_attribute WHERE entity_id = ? AND attribute_id = ?",
      [entity_id, attribute_id]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  getEntityValues: async (entity_id) => {
    const [rows] = await pool.query(
      "SELECT value_id, attribute_id, value_string, value_number, value_datetime, created_at FROM assignment_submission_entity_attribute WHERE entity_id = ?",
      [entity_id]
    );
    return rows;
  },

  getAttributeValues: async (attribute_id) => {
    const [rows] = await pool.query(
      "SELECT value_id, entity_id, value_string, value_number, value_datetime, created_at FROM assignment_submission_entity_attribute WHERE attribute_id = ?",
      [attribute_id]
    );
    return rows;
  },

  createValue: async (entity_id, attribute_id, value_data) => {
    const { value_string, value_number, value_datetime } = value_data;
    const [result] = await pool.query(
      "INSERT INTO assignment_submission_entity_attribute (entity_id, attribute_id, value_string, value_number, value_datetime) VALUES (?, ?, ?, ?, ?)",
      [entity_id, attribute_id, value_string || null, value_number || null, value_datetime || null]
    );
    return result.insertId;
  },

  updateValue: async (value_id, value_data) => {
    const { value_string, value_number, value_datetime } = value_data;
    const [result] = await pool.query(
      "UPDATE assignment_submission_entity_attribute SET value_string = ?, value_number = ?, value_datetime = ?, updated_at = CURRENT_TIMESTAMP WHERE value_id = ?",
      [value_string || null, value_number || null, value_datetime || null, value_id]
    );
    return result.affectedRows > 0;
  },

  deleteValue: async (value_id) => {
    const [result] = await pool.query(
      "DELETE FROM assignment_submission_entity_attribute WHERE value_id = ?",
      [value_id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = AssignmentSubmissionValue;
