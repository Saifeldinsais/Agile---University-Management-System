const pool = require("../Db_config/DB");

const CourseEntity = {
  createCourse: async (entity_type, entity_name) => {
    const [result] = await pool.query(
      "INSERT INTO course_entity (entity_type, entity_name) VALUES (?, ?)",
      [entity_type, entity_name]
    );
    return result.insertId;
  },

  getCourseById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM course_entity WHERE entity_id = ?",
      [id]
    );
    return rows[0] || null;
  },

  getAllCourses: async () => {
    const [rows] = await pool.query("SELECT * FROM course_entity");
    return rows;
  },

  updateCourse: async (id, entity_name) => {
    const [result] = await pool.query(
      "UPDATE course_entity SET entity_name = ? WHERE entity_id = ?",
      [entity_name, id]
    );
    return result.affectedRows > 0;
  },

  deleteCourse: async (id) => {
    const [result] = await pool.query(
      "DELETE FROM course_entity WHERE entity_id = ?",
      [id]
    );
    return result.affectedRows > 0;
  },

  // useful for unique checks (code)
  findByAttribute: async (attributeName, attributeValue) => {
    const [rows] = await pool.query(
      `SELECT ce.* FROM course_entity ce
       JOIN course_entity_attribute cea ON ce.entity_id = cea.entity_id
       JOIN course_attributes ca ON cea.attribute_id = ca.attribute_id
       WHERE ca.attribute_name = ? AND cea.value_string = ?
       LIMIT 1`,
      [attributeName, attributeValue]
    );
    return rows[0] || null;
  },
};

module.exports = CourseEntity;
