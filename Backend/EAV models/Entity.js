const pool = require('../Db_config/DB');

const Entity = {
  // Create a new entity (user, classroom, doctor, etc.)
  create: async (entity_type, entity_name) => {
    const [result] = await pool.query(
      "INSERT INTO entities (entity_type, entity_name) VALUES (?, ?)",
      [entity_type, entity_name]
    );
    return result.insertId;
  },

  // Find entity by ID
  findById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM entities WHERE entity_id = ?",
      [id]
    );
    return rows[0];
  },

  // Get all entities of a type
  findByType: async (type) => {
    const [rows] = await pool.query(
      "SELECT * FROM entities WHERE entity_type = ?",
      [type]
    );
    return rows;
  },


  findByAttribute: async (attributeName, attributeValue) => {
    const [rows] = await pool.query(
      `SELECT e.* FROM entities e
       JOIN entity_attribute ea ON e.entity_id = ea.entity_id
       JOIN attributes a ON ea.attribute_id = a.attribute_id
       WHERE a.attribute_name = ? AND ea.value_string = ?
       LIMIT 1`,
      [attributeName, attributeValue]
    );
    return rows[0] || null;
  }
};

module.exports = Entity;