const pool = require("../Db_config/DB");

const Value = {
    // Get single value for an entity's attribute
    getValue: async (entity_id, attribute_id) => {
        const [rows] = await pool.query(
            "SELECT value_id, value_string, value_number, value_reference, array_index, created_at FROM Entity_Attribute WHERE entity_id = ? AND attribute_id = ?",
            [entity_id, attribute_id]
        );
        return rows.length > 0 ? rows[0] : null;
    },

    // Get all values for an entity
    getEntityValues: async (entity_id) => {
        const [rows] = await pool.query(
            "SELECT value_id, attribute_id, value_string, value_number, value_reference, array_index, created_at FROM Entity_Attribute WHERE entity_id = ?",
            [entity_id]
        );
        return rows;
    },

    // Get all values for an attribute
    getAttributeValues: async (attribute_id) => {
        const [rows] = await pool.query(
            "SELECT value_id, entity_id, value_string, value_number, value_reference, array_index, created_at FROM Entity_Attribute WHERE attribute_id = ?",
            [attribute_id]
        );
        return rows;
    },

    // Create a new value
    createValue: async (entity_id, attribute_id, value_data) => {
        const { value_string, value_number, value_reference, array_index } = value_data;
        const [result] = await pool.query(
            "INSERT INTO Entity_Attribute (entity_id, attribute_id, value_string, value_number, value_reference, array_index) VALUES (?, ?, ?, ?, ?, ?)",
            [entity_id, attribute_id, value_string || null, value_number || null, value_reference || null, array_index || null]
        );
        return result.insertId;
    },

    // Update a value
    updateValue: async (value_id, value_data) => {
        const { value_string, value_number, value_reference, array_index } = value_data;
        const [result] = await pool.query(
            "UPDATE Entity_Attribute SET value_string = ?, value_number = ?, value_reference = ?, array_index = ? WHERE value_id = ?",
            [value_string || null, value_number || null, value_reference || null, array_index || null, value_id]
        );
        return result.affectedRows > 0;
    },

    // Delete a value
    deleteValue: async (value_id) => {
        const [result] = await pool.query(
            "DELETE FROM Entity_Attribute WHERE value_id = ?",
            [value_id]
        );
        return result.affectedRows > 0;
    },

    // Delete all values for an entity-attribute pair
    deleteAttributeValues: async (entity_id, attribute_id) => {
        const [result] = await pool.query(
            "DELETE FROM Entity_Attribute WHERE entity_id = ? AND attribute_id = ?",
            [entity_id, attribute_id]
        );
        return result.affectedRows;
    },

    // Get values with array indexing (for array-type attributes)
    getArrayValues: async (entity_id, attribute_id) => {
        const [rows] = await pool.query(
            "SELECT value_id, value_string, value_number, value_reference, array_index FROM Entity_Attribute WHERE entity_id = ? AND attribute_id = ? ORDER BY array_index ASC",
            [entity_id, attribute_id]
        );
        return rows;
    }
};

module.exports = Value;