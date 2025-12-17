const pool = require("../Db_config/DB");

const EnrollmentAttribute = {
  getAttributeByName: async (attribute_name) => {
    const [rows] = await pool.query(
      "SELECT * FROM enrollment_attributes WHERE attribute_name = ?",
      [attribute_name]
    );
    return rows[0] || null;
  },

  createEnrollmentAttribute: async (attribute_name, data_type) => {
    const existing = await EnrollmentAttribute.getAttributeByName(attribute_name);
    if (existing) return existing.attribute_id;

    const [result] = await pool.query(
      "INSERT INTO enrollment_attributes (attribute_name, data_type) VALUES (?, ?)",
      [attribute_name, data_type]
    );
    return result.insertId;
  },
};

module.exports = EnrollmentAttribute;
