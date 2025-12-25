const pool = require('../Db_config/DB');

const ParentEntity = {
    // Create a new parent entity
    create: async (entity_name) => {
        const [result] = await pool.query(
            "INSERT INTO parent_entity (entity_type, entity_name) VALUES ('parent', ?)",
            [entity_name]
        );
        return result.insertId;
    },

    // Find parent entity by ID
    findById: async (id) => {
        const [rows] = await pool.query(
            "SELECT * FROM parent_entity WHERE entity_id = ?",
            [id]
        );
        return rows[0];
    },

    // Get all parent entities
    getAll: async () => {
        const [rows] = await pool.query(
            "SELECT * FROM parent_entity ORDER BY created_at DESC"
        );
        return rows;
    },

    // Find parent by attribute value (e.g., email)
    findByAttribute: async (attributeName, attributeValue) => {
        const [rows] = await pool.query(
            `SELECT pe.* FROM parent_entity pe
             JOIN parent_entity_attribute pea ON pe.entity_id = pea.entity_id
             JOIN parent_attributes pa ON pea.attribute_id = pa.attribute_id
             WHERE pa.attribute_name = ? AND pea.value_string = ?
             LIMIT 1`,
            [attributeName, attributeValue]
        );
        return rows[0] || null;
    },

    // Delete parent entity
    delete: async (id) => {
        const [result] = await pool.query(
            "DELETE FROM parent_entity WHERE entity_id = ?",
            [id]
        );
        return result.affectedRows > 0;
    },

    // Update parent entity name
    update: async (id, entity_name) => {
        const [result] = await pool.query(
            "UPDATE parent_entity SET entity_name = ? WHERE entity_id = ?",
            [entity_name, id]
        );
        return result.affectedRows > 0;
    },

    // Get linked students for a parent
    getLinkedStudents: async (parentId) => {
        const [rows] = await pool.query(
            `SELECT psl.*, e.entity_name as student_name, e.entity_id as student_id
             FROM parent_student_link psl
             JOIN entities e ON psl.student_id = e.entity_id
             WHERE psl.parent_id = ? AND psl.link_status = 'active'`,
            [parentId]
        );
        return rows;
    },

    // Link a parent to a student
    linkStudent: async (parentId, studentId, relationship = 'parent') => {
        const [result] = await pool.query(
            `INSERT INTO parent_student_link (parent_id, student_id, relationship)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE relationship = ?, link_status = 'active'`,
            [parentId, studentId, relationship, relationship]
        );
        return result.insertId || result.affectedRows > 0;
    },

    // Unlink a parent from a student
    unlinkStudent: async (parentId, studentId) => {
        const [result] = await pool.query(
            `UPDATE parent_student_link 
             SET link_status = 'inactive' 
             WHERE parent_id = ? AND student_id = ?`,
            [parentId, studentId]
        );
        return result.affectedRows > 0;
    },

    // Check if parent is linked to a specific student
    isLinkedToStudent: async (parentId, studentId) => {
        const [rows] = await pool.query(
            `SELECT * FROM parent_student_link 
             WHERE parent_id = ? AND student_id = ? AND link_status = 'active'`,
            [parentId, studentId]
        );
        return rows.length > 0;
    }
};

module.exports = ParentEntity;
