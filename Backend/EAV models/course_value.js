const pool = require("../Db_config/DB");

const CourseValue = {
  getCourseValue: async (entity_id, attribute_id) => {
    const [rows] = await pool.query(
      `SELECT value_id, value_string, value_number, value_reference, array_index, created_at
       FROM course_entity_attribute
       WHERE entity_id = ? AND attribute_id = ?`,
      [entity_id, attribute_id]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  getAllCourseValues: async (entity_id, attribute_id) => {
    const [rows] = await pool.query(
      `SELECT * FROM course_entity_attribute
       WHERE entity_id = ? AND attribute_id = ?
       ORDER BY array_index ASC`,
      [entity_id, attribute_id]
    );
    return rows;
  },

  createCourseValue: async (entity_id, attribute_id, value_data) => {
    const { value_string, value_number, value_reference, array_index } = value_data;

    const [result] = await pool.query(
      `INSERT INTO course_entity_attribute
       (entity_id, attribute_id, value_string, value_number, value_reference, array_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        entity_id,
        attribute_id,
        value_string ?? null,
        value_number ?? null,
        value_reference ?? null,
        array_index ?? null,
      ]
    );

    return result.insertId;
  },

  updateCourseValue: async (value_id, value_data) => {
    const { value_string, value_number, value_reference, array_index } = value_data;

    const [result] = await pool.query(
      `UPDATE course_entity_attribute
       SET value_string = ?, value_number = ?, value_reference = ?, array_index = ?
       WHERE value_id = ?`,
      [
        value_string ?? null,
        value_number ?? null,
        value_reference ?? null,
        array_index ?? null,
        value_id,
      ]
    );

    return result.affectedRows > 0;
  },

  deleteCourseValue: async (value_id) => {
    const [result] = await pool.query(
      "DELETE FROM course_entity_attribute WHERE value_id = ?",
      [value_id]
    );
    return result.affectedRows > 0;
  },

  deleteCourseAttributeValues: async (entity_id, attribute_id) => {
    const [result] = await pool.query(
      "DELETE FROM course_entity_attribute WHERE entity_id = ? AND attribute_id = ?",
      [entity_id, attribute_id]
    );
    return result.affectedRows > 0;
  },
};

module.exports = CourseValue;
