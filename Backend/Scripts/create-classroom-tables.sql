USE university_management;

-- 1. Classroom Entity Table (stores classroom entities)
CREATE TABLE IF NOT EXISTS classroom_entity (
    entity_id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL DEFAULT 'classroom',
    entity_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_entity_type (entity_type),
    INDEX idx_entity_name (entity_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Classroom Attributes Table (defines classroom attributes)
CREATE TABLE IF NOT EXISTS classroom_attributes (
    attribute_id INT AUTO_INCREMENT PRIMARY KEY,
    attribute_name VARCHAR(100) NOT NULL UNIQUE,
    data_type ENUM('string', 'int', 'float', 'datetime', 'text', 'boolean') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_attribute_name (attribute_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Classroom Entity Attribute Values Table (stores attribute values)
CREATE TABLE IF NOT EXISTS classroom_entity_attribute (
    value_id INT AUTO_INCREMENT PRIMARY KEY,
    entity_id INT NOT NULL,
    attribute_id INT NOT NULL,
    value_string VARCHAR(500),
    value_number DECIMAL(20, 4),
    value_reference INT,
    array_index INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (entity_id) REFERENCES classroom_entity(entity_id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_id) REFERENCES classroom_attributes(attribute_id) ON DELETE CASCADE,

    UNIQUE KEY unique_entity_attribute (entity_id, attribute_id),
    INDEX idx_entity_id (entity_id),
    INDEX idx_attribute_id (attribute_id),
    INDEX idx_value_string (value_string(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Optional: Insert some default classroom attributes (safe, can be edited/deleted)
INSERT INTO classroom_attributes (attribute_name, data_type) VALUES
    ('building', 'string'),
    ('room_number', 'string'),
    ('capacity', 'int'),
    ('floor', 'int'),
    ('type', 'string')
ON DUPLICATE KEY UPDATE attribute_name = attribute_name;

SELECT 'Classroom tables created successfully!' AS message;