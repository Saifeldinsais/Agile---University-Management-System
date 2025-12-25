-- Course Assignment EAV Tables
-- This creates separate tables for managing staff assignments to courses

USE university_management;

-- 1. Assignment Entity Table (stores assignment entities)
CREATE TABLE IF NOT EXISTS assignment_entity (
    entity_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    staff_id INT NOT NULL,
    entity_type VARCHAR(50) NOT NULL DEFAULT 'assignment',
    entity_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_entity_type (entity_type),
    INDEX idx_course_id (course_id),
    INDEX idx_staff_id (staff_id),
    UNIQUE KEY unique_course_staff (course_id, staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Assignment Attributes Table (defines assignment attributes)
CREATE TABLE IF NOT EXISTS assignment_attributes (
    attribute_id INT AUTO_INCREMENT PRIMARY KEY,
    attribute_name VARCHAR(100) NOT NULL UNIQUE,
    attribute_type ENUM('string', 'int', 'float', 'datetime', 'text', 'boolean') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_attribute_name (attribute_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Assignment Entity Attribute Values Table (stores attribute values)
CREATE TABLE IF NOT EXISTS assignment_entity_attribute (
    value_id INT AUTO_INCREMENT PRIMARY KEY,
    entity_id INT NOT NULL,
    attribute_id INT NOT NULL,
    value_string VARCHAR(500),
    value_number DECIMAL(20, 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (entity_id) REFERENCES assignment_entity(entity_id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_id) REFERENCES assignment_attributes(attribute_id) ON DELETE CASCADE,
    UNIQUE KEY unique_entity_attribute (entity_id, attribute_id),
    INDEX idx_entity_id (entity_id),
    INDEX idx_attribute_id (attribute_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default assignment attributes
INSERT INTO assignment_attributes (attribute_name, attribute_type) VALUES
    ('role', 'string'),           -- 'instructor' or 'ta'
    ('department', 'string'),
    ('status', 'string'),         -- 'active', 'inactive'
    ('assigned_date', 'datetime'),
    ('notes', 'text')
ON DUPLICATE KEY UPDATE attribute_name=attribute_name;

-- Success message
SELECT 'Assignment EAV tables created successfully!' AS message;
SELECT COUNT(*) AS total_attributes FROM assignment_attributes;
