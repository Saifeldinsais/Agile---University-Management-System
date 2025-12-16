const pool = require('../Db_config/DB');


const ClassroomEntity = {

  createClassroom: async (classroom_type,classroom_name) => {
    const [result] = await pool.query(
      "INSERT INTO classroom_entity (entity_type, entity_name) VALUES (?, ?)",
      [classroom_type, classroom_name]
    );
    return result.insertId;
  },

  getClassroomById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM classroom_entity WHERE entity_id = ?",
      [id]
    );
    return rows[0];
  },

  getAllClassrooms: async () => {
    const [rows] = await pool.query(
      "SELECT * FROM classroom_entity"
    );
    return rows;
  },
  deleteClassroom: async (id) => {
    const [result] = await pool.query(
      "DELETE FROM classroom_entity WHERE entity_id = ?",
      [id]
    );
    return result.affectedRows > 0;
  },
  

  updateClassroom: async (id, classroom_name) => {  
    const [result] = await pool.query(
      "UPDATE classroom_entity SET entity_name = ? WHERE entity_id = ?",
      [classroom_name, id]
    );
    return result.affectedRows > 0;
  },

  findByAttribute: async (attributeName, attributeValue) => {
    const [rows] = await pool.query(
      `SELECT ce.* FROM classroom_entity ce
       JOIN classroom_entity_attribute cea ON ce.entity_id = cea.entity_id
       JOIN attributes a ON cea.attribute_id = a.attribute_id
       WHERE a.attribute_name = ? AND cea.value_string = ?
       LIMIT 1`,
      [attributeName, attributeValue]
    );
    return rows[0] || null;
  },
  getAllClassrooms: async () => {
    const [rows] = await pool.query(
      "SELECT * FROM classroom_entity"
    );
    return rows;
  },
};
module.exports = ClassroomEntity;