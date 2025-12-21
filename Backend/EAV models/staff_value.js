const pool = require("../Db_config/DB");

const StaffValue = {
    // Get single value for a staff entity's attribute
    getValue: async (entity_id, attribute_id) => {
        const [rows] = await pool.query(
            "SELECT value_id, value_string, value_number, value_reference, array_index, created_at FROM staff_entity_attribute WHERE entity_id = ? AND attribute_id = ?",
            [entity_id, attribute_id]
        );
        return rows.length > 0 ? rows[0] : null;
    },

    // Get all values for a staff entity
    getEntityValues: async (entity_id) => {
        const [rows] = await pool.query(
            "SELECT value_id, attribute_id, value_string, value_number, value_reference, array_index, created_at FROM staff_entity_attribute WHERE entity_id = ?",
            [entity_id]
        );
        return rows;
    },

    // Get all values for an attribute
    getAttributeValues: async (attribute_id) => {
        const [rows] = await pool.query(
            "SELECT value_id, entity_id, value_string, value_number, value_reference, array_index, created_at FROM staff_entity_attribute WHERE attribute_id = ?",
            [attribute_id]
        );
        return rows;
    },

    // Create a new value
    createValue: async (entity_id, attribute_id, value_data) => {
        const { value_string, value_number, value_reference, array_index } = value_data;
        const [result] = await pool.query(
            "INSERT INTO staff_entity_attribute (entity_id, attribute_id, value_string, value_number, value_reference, array_index) VALUES (?, ?, ?, ?, ?, ?)",
            [entity_id, attribute_id, value_string || null, value_number || null, value_reference || null, array_index || null]
        );
        return result.insertId;
    },

    // Update a value
    updateValue: async (value_id, value_data) => {
        const { value_string, value_number, value_reference, array_index } = value_data;
        const [result] = await pool.query(
            "UPDATE staff_entity_attribute SET value_string = ?, value_number = ?, value_reference = ?, array_index = ? WHERE value_id = ?",
            [value_string || null, value_number || null, value_reference || null, array_index || null, value_id]
        );
        return result.affectedRows > 0;
    },

    // Delete a value
    deleteValue: async (value_id) => {
        const [result] = await pool.query(
            "DELETE FROM staff_entity_attribute WHERE value_id = ?",
            [value_id]
        );
        return result.affectedRows > 0;
    },

    // Delete all values for an entity-attribute pair
    deleteAttributeValues: async (entity_id, attribute_id) => {
        const [result] = await pool.query(
            "DELETE FROM staff_entity_attribute WHERE entity_id = ? AND attribute_id = ?",
            [entity_id, attribute_id]
        );
        return result.affectedRows;
    },

    // Get values with array indexing (for array-type attributes like office hours)
    getArrayValues: async (entity_id, attribute_id) => {
        const [rows] = await pool.query(
            "SELECT value_id, value_string, value_number, value_reference, array_index FROM staff_entity_attribute WHERE entity_id = ? AND attribute_id = ? ORDER BY array_index ASC",
            [entity_id, attribute_id]
        );
        return rows;
    },

    // Upsert value - create or update
    upsertValue: async (entity_id, attribute_id, value_data) => {
        const existing = await StaffValue.getValue(entity_id, attribute_id);
        if (existing) {
            await StaffValue.updateValue(existing.value_id, value_data);
            return existing.value_id;
        } else {
            return await StaffValue.createValue(entity_id, attribute_id, value_data);
        }
    }
};

module.exports = StaffValue;
