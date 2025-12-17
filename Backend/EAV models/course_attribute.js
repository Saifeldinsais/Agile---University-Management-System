const pool = require("../Db_config/DB");

const CourseAttribute = {
  getAttributeByName: async (attribute_name) => {
    const [rows] = await pool.query(
      "SELECT * FROM course_attributes WHERE attribute_name = ?",
      [attribute_name]
    );
    return rows[0] || null;
  },

  createCourseAttribute: async (attribute_name, data_type) => {
    const existing = await CourseAttribute.getAttributeByName(attribute_name);
    if (existing) return existing.attribute_id;

    const [result] = await pool.query(
      "INSERT INTO course_attributes (attribute_name, data_type) VALUES (?, ?)",
      [attribute_name, data_type]
    );
    return result.insertId;
  },

  getCourseAttributeById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM course_attributes WHERE attribute_id = ?",
      [id]
    );
    return rows[0] || null;
  },

  getAllCourseAttributes: async () => {
    const [rows] = await pool.query("SELECT * FROM course_attributes");
    return rows;
  },

  updateCourseAttribute: async (id, attribute_name, data_type) => {
    const [result] = await pool.query(
      "UPDATE course_attributes SET attribute_name = ?, data_type = ? WHERE attribute_id = ?",
      [attribute_name, data_type, id]
    );
    return result.affectedRows > 0;
  },

  deleteCourseAttribute: async (id) => {
    const [result] = await pool.query(
      "DELETE FROM course_attributes WHERE attribute_id = ?",
      [id]
    );
    return result.affectedRows > 0;
  },
};

module.exports = CourseAttribute;
