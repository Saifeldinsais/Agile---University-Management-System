const pool = require("../Db_config/DB");

const Attribute = {
  // Create a new attribute
  create: async (attribute_name, data_type) => {    
    const [result] = await pool.query(
      "INSERT INTO attributes (attribute_name, data_type) VALUES (?, ?)",
      [attribute_name, data_type]
    );
    return result.insertId;
  },
  
  // Find attribute by ID 
  findById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM attributes WHERE attribute_id = ?",
      [id]
    );
    return rows[0];
  },
  
  // Get all attributes
  findAll: async () => {
    const [rows] = await pool.query(
      "SELECT * FROM attributes"
    );
    return rows;
  },

  // NEW: Find attribute by name
  getAttributeByName: async (attributeName) => {
    const [rows] = await pool.query(
      "SELECT * FROM attributes WHERE attribute_name = ?",
      [attributeName]
    );
    return rows[0] || null;
  }
};

module.exports = Attribute;