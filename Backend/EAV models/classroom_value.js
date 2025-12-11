const pool = require("../Db_config/DB");


const ClassroomValue = {
    getClassroomValue: async (entity_id, attribute_id) => {
        const [rows] = await pool.query(
            "SELECT value_id, value_string, value_number, value_reference, array_index, created_at FROM classroom_entity_attribute WHERE entity_id = ? AND attribute_id = ?",
            [entity_id, attribute_id]
        );
        return rows.length > 0 ? rows[0] : null;
    },

    createClassroomValue: async (entity_id, attribute_id, value_data) => {
        const { value_string, value_number, value_reference, array_index } = value_data;
        const [result] = await pool.query(
            "INSERT INTO classroom_entity_attribute (entity_id, attribute_id, value_string, value_number, value_reference, array_index) VALUES (?, ?, ?, ?, ?, ?)",
            [entity_id, attribute_id, value_string || null, value_number || null, value_reference || null, array_index || null]
        );
        return result.insertId;
    },
    updateClassroomValue: async (value_id, value_data) => {
        const { value_string, value_number, value_reference, array_index } = value_data;
        const [result] = await pool.query(  
            "UPDATE classroom_entity_attribute SET value_string = ?, value_number = ?, value_reference = ?, array_index = ? WHERE value_id = ?",
            [value_string || null, value_number || null, value_reference || null, array_index || null, value_id]
        );
        return result.affectedRows > 0;
    },
    deleteClassroomValue: async (value_id) => {
        const [result] = await pool.query(  
            "DELETE FROM classroom_entity_attribute WHERE value_id = ?",
            [value_id]
        );
        return result.affectedRows > 0;
    },
    deleteClassroomAttributeValues: async (entity_id, attribute_id) => {
        const [result] = await pool.query(
            "DELETE FROM classroom_entity_attribute WHERE entity_id = ? AND attribute_id = ?",
            [entity_id, attribute_id]
        );
        return result.affectedRows > 0;
    }   
};
module.exports = ClassroomValue;