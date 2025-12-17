require("dotenv").config();
const pool = require("../Db_config/DB");

console.log("DB Config Check:", {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD ? "******" : "(Not Set - This might be the issue)",
    database: process.env.MYSQL_DBNAME
});

const createTables = async () => {
    try {
        const queries = [
            // General EAV Tables
            `CREATE TABLE IF NOT EXISTS entities (
        entity_id INT AUTO_INCREMENT PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_name VARCHAR(255)
      );`,

            `CREATE TABLE IF NOT EXISTS attributes (
        attribute_id INT AUTO_INCREMENT PRIMARY KEY,
        attribute_name VARCHAR(255) NOT NULL UNIQUE,
        data_type VARCHAR(50) NOT NULL
      );`,

            `CREATE TABLE IF NOT EXISTS Entity_Attribute (
        value_id INT AUTO_INCREMENT PRIMARY KEY,
        entity_id INT NOT NULL,
        attribute_id INT NOT NULL,
        value_string LONGTEXT,
        value_number DOUBLE,
        value_reference INT,
        array_index INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (entity_id) REFERENCES entities(entity_id) ON DELETE CASCADE,
        FOREIGN KEY (attribute_id) REFERENCES attributes(attribute_id) ON DELETE CASCADE
      );`,

            // Classroom EAV Tables
            `CREATE TABLE IF NOT EXISTS classroom_entity (
        entity_id INT AUTO_INCREMENT PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_name VARCHAR(255)
      );`,

            `CREATE TABLE IF NOT EXISTS classroom_attributes (
        attribute_id INT AUTO_INCREMENT PRIMARY KEY,
        attribute_name VARCHAR(255) NOT NULL UNIQUE,
        data_type VARCHAR(50) NOT NULL
      );`,

            `CREATE TABLE IF NOT EXISTS classroom_entity_attribute (
        value_id INT AUTO_INCREMENT PRIMARY KEY,
        entity_id INT NOT NULL,
        attribute_id INT NOT NULL,
        value_string LONGTEXT,
        value_number DOUBLE,
        value_reference INT,
        array_index INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (entity_id) REFERENCES classroom_entity(entity_id) ON DELETE CASCADE,
        FOREIGN KEY (attribute_id) REFERENCES classroom_attributes(attribute_id) ON DELETE CASCADE
      );`
        ];

        console.log("Creating tables...");
        for (const query of queries) {
            await pool.query(query);
        }
        console.log("All tables created successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error creating tables:", error);
        process.exit(1);
    }
};

createTables();
