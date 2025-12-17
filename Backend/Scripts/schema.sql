-- University Management System Database Schema
-- EAV (Entity-Attribute-Value) Model

-- Create database
CREATE DATABASE IF NOT EXISTS university_management;
USE university_management;

-- 1. Entities Table (Core table for all entities: users, courses, etc.)
CREATE TABLE IF NOT EXISTS entities (
    entity_id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,  -- 'student', 'doctor', 'admin', 'course', etc.
    entity_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_entity_type (entity_type)
);

-- 2. Attributes Table (Defines all possible attributes)
CREATE TABLE IF NOT EXISTS attributes (
    attribute_id INT AUTO_INCREMENT PRIMARY KEY,
    attribute_name VARCHAR(100) NOT NULL UNIQUE,
    data_type ENUM('string', 'int', 'float', 'datetime', 'text', 'boolean') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_attribute_name (attribute_name)
);

-- 3. Entity Attribute Values Table (Stores all attribute values)
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

-- Insert default attributes for users
INSERT INTO attributes (attribute_name, data_type) VALUES
    ('email', 'string'),
    ('password', 'string'),
    ('username', 'string')
ON DUPLICATE KEY UPDATE attribute_name=attribute_name;

-- Insert default attributes for courses (you can add more as needed)
INSERT INTO attributes (attribute_name, data_type) VALUES
    ('course_code', 'string'),
    ('course_name', 'string'),
    ('description', 'text'),
    ('credits', 'int'),
    ('department', 'string')
ON DUPLICATE KEY UPDATE attribute_name=attribute_name;

-- Insert default attributes for enrollments
INSERT INTO attributes (attribute_name, data_type) VALUES
    ('enrollment_date', 'datetime'),
    ('grade', 'string'),
    ('status', 'string')
ON DUPLICATE KEY UPDATE attribute_name=attribute_name;

-- Sample admin user (password is 'admin123' - hashed with bcrypt)
-- You should change this after first login
-- INSERT INTO entities (entity_type, entity_name) VALUES ('admin', 'System Admin');
-- Get the last inserted ID and insert attributes
-- SET @admin_id = LAST_INSERT_ID();
-- INSERT INTO entity_attribute (entity_id, attribute_id, value_string)
-- SELECT @admin_id, attribute_id, 'admin@admin' FROM attributes WHERE attribute_name = 'email';
-- INSERT INTO entity_attribute (entity_id, attribute_id, value_string)
-- SELECT @admin_id, attribute_id, '$2a$10$YourHashedPasswordHere' FROM attributes WHERE attribute_name = 'password';
-- INSERT INTO entity_attribute (entity_id, attribute_id, value_string)
-- SELECT @admin_id, attribute_id, 'admin' FROM attributes WHERE attribute_name = 'username';
