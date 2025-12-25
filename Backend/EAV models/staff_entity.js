const pool = require('../Db_config/DB');

const StaffEntity = {
    // Create a new staff entity (professor, ta)
    create: async (entity_type, entity_name) => {
        const [result] = await pool.query(
            "INSERT INTO staff_entity (entity_type, entity_name) VALUES (?, ?)",
            [entity_type, entity_name]
        );
        return result.insertId;
    },

    // Find staff entity by ID
    findById: async (id) => {
        const [rows] = await pool.query(
            "SELECT * FROM staff_entity WHERE entity_id = ?",
            [id]
        );
        return rows[0];
    },

    // Get all staff entities of a type (professor, ta)
    findByType: async (type) => {
        const [rows] = await pool.query(
            "SELECT * FROM staff_entity WHERE entity_type = ?",
            [type]
        );
        return rows;
    },

    // Get all staff entities
    getAllStaff: async () => {
        const [rows] = await pool.query(
            "SELECT * FROM staff_entity"
        );
        return rows;
    },

    // Find staff by attribute value
    findByAttribute: async (attributeName, attributeValue) => {
        const [rows] = await pool.query(
            `SELECT se.* FROM staff_entity se
       JOIN staff_entity_attribute sea ON se.entity_id = sea.entity_id
       JOIN staff_attributes sa ON sea.attribute_id = sa.attribute_id
       WHERE sa.attribute_name = ? AND sea.value_string = ?
       LIMIT 1`,
            [attributeName, attributeValue]
        );
        return rows[0] || null;
    },

    // Delete staff entity
    delete: async (id) => {
        const [result] = await pool.query(
            "DELETE FROM staff_entity WHERE entity_id = ?",
            [id]
        );
        return result.affectedRows > 0;
    },

    // Update staff entity name
    update: async (id, entity_name) => {
        const [result] = await pool.query(
            "UPDATE staff_entity SET entity_name = ? WHERE entity_id = ?",
            [entity_name, id]
        );
        return result.affectedRows > 0;
    }
};

module.exports = StaffEntity;
