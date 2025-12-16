const pool  = require('../Db_config/DB');
const ClassroomAttribute = {


  getAttributeByName: async (attribute_name) => {  
    const [rows] = await pool.query(
      "SELECT * FROM classroom_attributes WHERE attribute_name = ?",  
      [attribute_name]
    );
    return rows[0];
  },

  createClassroomAttribute: async (attribute_name, data_type) => {  
    const existing = await ClassroomAttribute.getAttributeByName(attribute_name);
    if (existing) {
        return existing.attribute_id;  
    }
    const [result] = await pool.query(
      "INSERT INTO classroom_attributes (attribute_name, data_type) VALUES (?, ?)",  
      [attribute_name, data_type]
    );
    return result.insertId;
},

    getClassroomAttributeById: async (id) => {  
    const [rows] = await pool.query(
      "SELECT * FROM classroom_attributes WHERE attribute_id = ?",
      [id]
    );
    return rows[0];
  },
    getAllClassroomAttributes: async () => {
    const [rows] = await pool.query(
      "SELECT * FROM classroom_attributes"
    );
    return rows;
  },
    updateClassroomAttribute: async (id, attribute_name, data_type) => {    
    const [result] = await pool.query(
      "UPDATE classroom_attributes SET attribute_name = ?, data_type = ? WHERE attribute_id = ?",
      [attribute_name, data_type, id]
    );
    return result.affectedRows > 0;
  },
    deleteClassroomAttribute: async (id) => {
    const [result] = await pool.query(
      "DELETE FROM classroom_attributes WHERE attribute_id = ?",    
        [id]
    );
    return result.affectedRows > 0;
  }
};
module.exports = ClassroomAttribute;