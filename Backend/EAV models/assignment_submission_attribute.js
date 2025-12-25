const pool = require("../Db_config/DB");

const AssignmentSubmissionAttribute = {
  create: async (attribute_name, data_type) => {
    const [result] = await pool.query(
      "INSERT INTO assignment_submission_attributes (attribute_name, attribute_type) VALUES (?, ?)",
      [attribute_name, data_type]
    );
    return result.insertId;
  },

  findById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM assignment_submission_attributes WHERE attribute_id = ?",
      [id]
    );
    return rows[0];
  },

  findAll: async () => {
    const [rows] = await pool.query(
      "SELECT * FROM assignment_submission_attributes"
    );
    return rows;
  },

  getAttributeByName: async (attributeName) => {
    const [rows] = await pool.query(
      "SELECT * FROM assignment_submission_attributes WHERE attribute_name = ?",
      [attributeName]
    );
    return rows[0] || null;
  },

  createIfNotExists: async (attribute_name, data_type) => {
    const existing = await this.getAttributeByName(attribute_name);
    if (existing) return existing.attribute_id;

    const result = await this.create(attribute_name, data_type);
    return result;
  }
};

module.exports = AssignmentSubmissionAttribute;
