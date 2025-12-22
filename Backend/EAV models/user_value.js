const pool = require("../Db_config/DB");

const Value = {
    // Get single value for an entity's attribute
    getValue: async (entity_id, attribute_id) => {
        const [rows] = await pool.query(
            "SELECT ea_id as value_id, value_string, value_float as value_number, value_int as value_reference, created_at FROM entity_attribute WHERE entity_id = ? AND attribute_id = ?",
            [entity_id, attribute_id]
        );
        return rows.length > 0 ? rows[0] : null;
    },

    // Get all values for an entity
    getEntityValues: async (entity_id) => {
        const [rows] = await pool.query(
            "SELECT ea_id as value_id, attribute_id, value_string, value_float as value_number, value_int as value_reference, created_at FROM entity_attribute WHERE entity_id = ?",
            [entity_id]
        );
        return rows;
    },

    // Get all values for an attribute
    getAttributeValues: async (attribute_id) => {
        const [rows] = await pool.query(
            "SELECT ea_id as value_id, entity_id, value_string, value_float as value_number, value_int as value_reference, created_at FROM entity_attribute WHERE attribute_id = ?",
            [attribute_id]
        );
        return rows;
    },

    // Create a new value
    createValue: async (entity_id, attribute_id, value_data) => {
        const { value_string, value_number, value_reference } = value_data;
        // Mapping: value_number -> value_float, value_reference -> value_int
        const [result] = await pool.query(
            "INSERT INTO entity_attribute (entity_id, attribute_id, value_string, value_float, value_int) VALUES (?, ?, ?, ?, ?)",
            [entity_id, attribute_id, value_string || null, value_number || null, value_reference || null]
        );
        return result.insertId;
    },

    // Update a value
    updateValue: async (value_id, value_data) => {
        const { value_string, value_number, value_reference } = value_data;
        const [result] = await pool.query(
            "UPDATE entity_attribute SET value_string = ?, value_float = ?, value_int = ? WHERE ea_id = ?",
            [value_string || null, value_number || null, value_reference || null, value_id]
        );
        return result.affectedRows > 0;
    },

    // Delete a value
    deleteValue: async (value_id) => {
        const [result] = await pool.query(
            "DELETE FROM entity_attribute WHERE ea_id = ?",
            [value_id]
        );
        return result.affectedRows > 0;
    },

    // Delete all values for an entity-attribute pair
    deleteAttributeValues: async (entity_id, attribute_id) => {
        const [result] = await pool.query(
            "DELETE FROM entity_attribute WHERE entity_id = ? AND attribute_id = ?",
            [entity_id, attribute_id]
        );
        return result.affectedRows;
    },

    // Get values with array indexing (for array-type attributes)
    // Note: array_index column does not exist in entity_attribute, so we ignore it and return values without specific order
    getArrayValues: async (entity_id, attribute_id) => {
        const [rows] = await pool.query(
            "SELECT ea_id as value_id, value_string, value_float as value_number, value_int as value_reference FROM entity_attribute WHERE entity_id = ? AND attribute_id = ?",
            [entity_id, attribute_id]
        );
        return rows;
    }
};
module.exports = Value;