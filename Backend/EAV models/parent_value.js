const pool = require('../Db_config/DB');
const ParentAttribute = require('./parent_attribute');

const ParentValue = {
    // Set a string value for a parent attribute
    setString: async (entityId, attributeName, value) => {
        const attrId = await ParentAttribute.getIdByName(attributeName);
        if (!attrId) {
            throw new Error(`Attribute "${attributeName}" not found`);
        }

        const [result] = await pool.query(
            `INSERT INTO parent_entity_attribute (entity_id, attribute_id, value_string)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE value_string = ?, updated_at = CURRENT_TIMESTAMP`,
            [entityId, attrId, value, value]
        );
        return result.insertId || result.affectedRows > 0;
    },

    // Set a number value for a parent attribute
    setNumber: async (entityId, attributeName, value) => {
        const attrId = await ParentAttribute.getIdByName(attributeName);
        if (!attrId) {
            throw new Error(`Attribute "${attributeName}" not found`);
        }

        const [result] = await pool.query(
            `INSERT INTO parent_entity_attribute (entity_id, attribute_id, value_number)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE value_number = ?, updated_at = CURRENT_TIMESTAMP`,
            [entityId, attrId, value, value]
        );
        return result.insertId || result.affectedRows > 0;
    },

    // Set a reference value for a parent attribute
    setReference: async (entityId, attributeName, refId) => {
        const attrId = await ParentAttribute.getIdByName(attributeName);
        if (!attrId) {
            throw new Error(`Attribute "${attributeName}" not found`);
        }

        const [result] = await pool.query(
            `INSERT INTO parent_entity_attribute (entity_id, attribute_id, value_reference)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE value_reference = ?, updated_at = CURRENT_TIMESTAMP`,
            [entityId, attrId, refId, refId]
        );
        return result.insertId || result.affectedRows > 0;
    },

    // Get a specific attribute value for a parent
    get: async (entityId, attributeName) => {
        const [rows] = await pool.query(
            `SELECT pea.* FROM parent_entity_attribute pea
             JOIN parent_attributes pa ON pea.attribute_id = pa.attribute_id
             WHERE pea.entity_id = ? AND pa.attribute_name = ?`,
            [entityId, attributeName]
        );
        if (!rows[0]) return null;

        const row = rows[0];
        return row.value_string || row.value_number || row.value_reference;
    },

    // Get all attributes for a parent entity
    getAllForEntity: async (entityId) => {
        const [rows] = await pool.query(
            `SELECT pa.attribute_name, pa.data_type,
                    pea.value_string, pea.value_number, pea.value_reference
             FROM parent_entity_attribute pea
             JOIN parent_attributes pa ON pea.attribute_id = pa.attribute_id
             WHERE pea.entity_id = ?`,
            [entityId]
        );

        // Convert to key-value object
        const result = {};
        rows.forEach(row => {
            result[row.attribute_name] = row.value_string || row.value_number || row.value_reference;
        });
        return result;
    },

    // Delete a specific attribute value
    delete: async (entityId, attributeName) => {
        const attrId = await ParentAttribute.getIdByName(attributeName);
        if (!attrId) return false;

        const [result] = await pool.query(
            `DELETE FROM parent_entity_attribute 
             WHERE entity_id = ? AND attribute_id = ?`,
            [entityId, attrId]
        );
        return result.affectedRows > 0;
    },

    // Delete all attribute values for an entity
    deleteAllForEntity: async (entityId) => {
        const [result] = await pool.query(
            "DELETE FROM parent_entity_attribute WHERE entity_id = ?",
            [entityId]
        );
        return result.affectedRows;
    },

    // Bulk set multiple attributes at once
    setMultiple: async (entityId, attributes) => {
        const results = [];
        for (const [key, value] of Object.entries(attributes)) {
            if (value === null || value === undefined) continue;

            if (typeof value === 'number') {
                results.push(await ParentValue.setNumber(entityId, key, value));
            } else {
                results.push(await ParentValue.setString(entityId, key, String(value)));
            }
        }
        return results.every(r => r);
    }
};

module.exports = ParentValue;
