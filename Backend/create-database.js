require("dotenv").config();
const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  multipleStatements: true
});

const schema = `
CREATE DATABASE IF NOT EXISTS university_management;
USE university_management;

CREATE TABLE IF NOT EXISTS entities (
    entity_id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_entity_type (entity_type)
);

CREATE TABLE IF NOT EXISTS attributes (
    attribute_id INT AUTO_INCREMENT PRIMARY KEY,
    attribute_name VARCHAR(100) NOT NULL UNIQUE,
    data_type ENUM('string', 'int', 'float', 'datetime', 'text', 'boolean') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_attribute_name (attribute_name)
);

CREATE TABLE IF NOT EXISTS entity_attribute (
    ea_id INT AUTO_INCREMENT PRIMARY KEY,
    entity_id INT NOT NULL,
    attribute_id INT NOT NULL,
    value_string VARCHAR(500),
    value_int INT,
    value_float DECIMAL(10, 2),
    value_datetime DATETIME,
    value_text TEXT,
    value_boolean BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (entity_id) REFERENCES entities(entity_id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_id) REFERENCES attributes(attribute_id) ON DELETE CASCADE,
    UNIQUE KEY unique_entity_attribute (entity_id, attribute_id),
    INDEX idx_entity_id (entity_id),
    INDEX idx_attribute_id (attribute_id)
);

INSERT INTO attributes (attribute_name, data_type) VALUES
    ('email', 'string'),
    ('password', 'string'),
    ('username', 'string'),
    ('course_code', 'string'),
    ('course_name', 'string'),
    ('description', 'text'),
    ('credits', 'int'),
    ('department', 'string'),
    ('enrollment_date', 'datetime'),
    ('grade', 'string'),
    ('status', 'string')
ON DUPLICATE KEY UPDATE attribute_name=attribute_name;
`;

connection.query(schema, (err, results) => {
  if (err) {
    console.error("Error creating database:", err);
    process.exit(1);
  } else {
    console.log("✅ Database 'university_management' created successfully!");
    console.log("✅ Tables created successfully!");
    console.log("✅ Default attributes inserted!");
    connection.end();
    process.exit(0);
  }
});

