const pool = require('../Db_config/DB');

const ParentAttribute = {
    // Get attribute by name
    getByName: async (attributeName) => {
        const [rows] = await pool.query(
            "SELECT * FROM parent_attributes WHERE attribute_name = ?",
            [attributeName]
        );
        return rows[0] || null;
    },

    // Get attribute ID by name
    getIdByName: async (attributeName) => {
        const [rows] = await pool.query(
            "SELECT attribute_id FROM parent_attributes WHERE attribute_name = ?",
            [attributeName]
        );
        return rows[0]?.attribute_id || null;
    },

    // Create a new attribute
    create: async (attributeName, dataType) => {
        const [result] = await pool.query(
            "INSERT INTO parent_attributes (attribute_name, data_type) VALUES (?, ?)",
            [attributeName, dataType]
        );
        return result.insertId;
    },

    // Get all attributes
    getAll: async () => {
        const [rows] = await pool.query(
            "SELECT * FROM parent_attributes ORDER BY attribute_name"
        );
        return rows;
    },

    // Ensure attribute exists (create if not)
    ensure: async (attributeName, dataType = 'string') => {
        let attr = await ParentAttribute.getByName(attributeName);
        if (!attr) {
            const id = await ParentAttribute.create(attributeName, dataType);
            attr = { attribute_id: id, attribute_name: attributeName, data_type: dataType };
        }
        return attr;
    },

    // Delete attribute
    delete: async (attributeId) => {
        const [result] = await pool.query(
            "DELETE FROM parent_attributes WHERE attribute_id = ?",
            [attributeId]
        );
        return result.affectedRows > 0;
    }
};

module.exports = ParentAttribute;
