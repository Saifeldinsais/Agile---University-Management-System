-- Migration to fix entity_attribute table schema
-- This aligns the database with the code expectations

USE university_management;

-- Drop the existing table to recreate with correct columns
DROP TABLE IF EXISTS entity_attribute;

-- Recreate with correct column names that match the code
CREATE TABLE entity_attribute (
    value_id INT AUTO_INCREMENT PRIMARY KEY,
    entity_id INT NOT NULL,
    attribute_id INT NOT NULL,
    value_string VARCHAR(500),
    value_number DECIMAL(20, 4),  -- Replaces value_int and value_float
    value_reference INT,           -- For foreign key references
    array_index INT,               -- For array-type attributes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (entity_id) REFERENCES entities(entity_id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_id) REFERENCES attributes(attribute_id) ON DELETE CASCADE,
    UNIQUE KEY unique_entity_attribute (entity_id, attribute_id),
    INDEX idx_entity_id (entity_id),
    INDEX idx_attribute_id (attribute_id)
);

-- Success message
SELECT 'Migration completed successfully! entity_attribute table has been updated.' AS message;
