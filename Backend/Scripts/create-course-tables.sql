-- Course-specific EAV Tables
-- This creates separate tables for course management

USE university_management;

-- 1. Course Entity Table (stores course entities)
CREATE TABLE IF NOT EXISTS course_entity (
    entity_id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL DEFAULT 'course',
    entity_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_entity_type (entity_type),
    INDEX idx_entity_name (entity_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Course Attributes Table (defines course attributes)
CREATE TABLE IF NOT EXISTS course_attributes (
    attribute_id INT AUTO_INCREMENT PRIMARY KEY,
    attribute_name VARCHAR(100) NOT NULL UNIQUE,
    data_type ENUM('string', 'int', 'float', 'datetime', 'text', 'boolean') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_attribute_name (attribute_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Course Entity Attribute Values Table (stores attribute values)
CREATE TABLE IF NOT EXISTS course_entity_attribute (
    value_id INT AUTO_INCREMENT PRIMARY KEY,
    entity_id INT NOT NULL,
    attribute_id INT NOT NULL,
    value_string VARCHAR(500),
    value_number DECIMAL(20, 4),
    value_reference INT,
    array_index INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (entity_id) REFERENCES course_entity(entity_id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_id) REFERENCES course_attributes(attribute_id) ON DELETE CASCADE,
    UNIQUE KEY unique_entity_attribute (entity_id, attribute_id),
    INDEX idx_entity_id (entity_id),
    INDEX idx_attribute_id (attribute_id),
    INDEX idx_value_string (value_string(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default course attributes
INSERT INTO course_attributes (attribute_name, data_type) VALUES
    ('course_code', 'string'),
    ('course_name', 'string'),
    ('description', 'text'),
    ('credits', 'int'),
    ('department', 'string'),
    ('instructor_id', 'int'),
    ('semester', 'string'),
    ('year', 'int'),
    ('max_students', 'int'),
    ('enrolled_count', 'int')
ON DUPLICATE KEY UPDATE attribute_name=attribute_name;

-- Success message
SELECT 'Course EAV tables created successfully!' AS message;
SELECT COUNT(*) AS total_attributes FROM course_attributes;
