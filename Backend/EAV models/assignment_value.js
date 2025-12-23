const pool = require("../Db_config/DB");

const AssignmentValue = {
  createAssignmentValue: async (
    entity_id,
    attribute_id,
    { value_string = null, value_number = null }
  ) => {
    const [result] = await pool.query(
      `INSERT INTO assignment_entity_attribute 
       (entity_id, attribute_id, value_string, value_number) 
       VALUES (?, ?, ?, ?)`,
      [entity_id, attribute_id, value_string, value_number]
    );
    return result.insertId;
  },

  getAssignmentValue: async (entity_id, attribute_id) => {
    const [rows] = await pool.query(
      `SELECT * FROM assignment_entity_attribute 
       WHERE entity_id = ? AND attribute_id = ?`,
      [entity_id, attribute_id]
    );
    return rows[0] || null;
  },

  getAssignmentValues: async (entity_id) => {
    const [rows] = await pool.query(
      `SELECT * FROM assignment_entity_attribute WHERE entity_id = ?`,
      [entity_id]
    );
    return rows;
  },

  updateAssignmentValue: async (
    entity_id,
    attribute_id,
    { value_string = null, value_number = null }
  ) => {
    const [result] = await pool.query(
      `UPDATE assignment_entity_attribute 
       SET value_string = ?, value_number = ? 
       WHERE entity_id = ? AND attribute_id = ?`,
      [value_string, value_number, entity_id, attribute_id]
    );
    return result.affectedRows > 0;
  },

  deleteAssignmentValue: async (entity_id, attribute_id) => {
    const [result] = await pool.query(
      `DELETE FROM assignment_entity_attribute 
       WHERE entity_id = ? AND attribute_id = ?`,
      [entity_id, attribute_id]
    );
    return result.affectedRows > 0;
  },
};

module.exports = AssignmentValue;
