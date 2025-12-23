const pool = require("../Db_config/DB");

const AssignmentAttribute = {
  createAssignmentAttribute: async (attribute_name, attribute_type) => {
    const [result] = await pool.query(
      "INSERT INTO assignment_attributes (attribute_name, attribute_type) VALUES (?, ?)",
      [attribute_name, attribute_type]
    );
    return result.insertId;
  },

  getAttributeByName: async (attribute_name) => {
    const [rows] = await pool.query(
      "SELECT * FROM assignment_attributes WHERE attribute_name = ?",
      [attribute_name]
    );
    return rows[0] || null;
  },

  getAttributeById: async (attribute_id) => {
    const [rows] = await pool.query(
      "SELECT * FROM assignment_attributes WHERE attribute_id = ?",
      [attribute_id]
    );
    return rows[0] || null;
  },

  getAllAttributes: async () => {
    const [rows] = await pool.query("SELECT * FROM assignment_attributes");
    return rows;
  },

  createIfNotExists: async (attribute_name, attribute_type) => {
    const existing = await AssignmentAttribute.getAttributeByName(attribute_name);
    if (existing) return existing.attribute_id;

    const id = await AssignmentAttribute.createAssignmentAttribute(
      attribute_name,
      attribute_type
    );
    return id;
  },
};

module.exports = AssignmentAttribute;
