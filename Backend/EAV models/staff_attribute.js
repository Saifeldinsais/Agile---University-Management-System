const pool = require("../Db_config/DB");

const StaffAttribute = {
    // Create a new staff attribute
    create: async (attribute_name, data_type) => {
        const [result] = await pool.query(
            "INSERT INTO staff_attributes (attribute_name, data_type) VALUES (?, ?)",
            [attribute_name, data_type]
        );
        return result.insertId;
    },

    // Find attribute by ID
    findById: async (id) => {
        const [rows] = await pool.query(
            "SELECT * FROM staff_attributes WHERE attribute_id = ?",
            [id]
        );
        return rows[0];
    },

    // Get all attributes
    findAll: async () => {
        const [rows] = await pool.query(
            "SELECT * FROM staff_attributes"
        );
        return rows;
    },

    // Find attribute by name
    getAttributeByName: async (attributeName) => {
        const [rows] = await pool.query(
            "SELECT * FROM staff_attributes WHERE attribute_name = ?",
            [attributeName]
        );
        return rows[0] || null;
    },

    // Create attribute if not exists
    createIfNotExists: async (attribute_name, data_type) => {
        const existing = await StaffAttribute.getAttributeByName(attribute_name);
        if (existing) {
            return existing.attribute_id;
        }
        return await StaffAttribute.create(attribute_name, data_type);
    }
};

module.exports = StaffAttribute;
