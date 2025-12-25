-- Staff Module EAV Tables
-- Following the same pattern as course_entity, classroom_entity, enrollment_entity

-- 1. Staff Entity Table
CREATE TABLE IF NOT EXISTS staff_entity (
    entity_id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_staff_entity_type (entity_type)
);

-- 2. Staff Attributes Table
CREATE TABLE IF NOT EXISTS staff_attributes (
    attribute_id INT AUTO_INCREMENT PRIMARY KEY,
    attribute_name VARCHAR(100) NOT NULL UNIQUE,
    data_type ENUM('string', 'int', 'float', 'datetime', 'text', 'boolean') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_staff_attribute_name (attribute_name)
);

-- 3. Staff Entity-Attribute Values Table
CREATE TABLE IF NOT EXISTS staff_entity_attribute (
    value_id INT AUTO_INCREMENT PRIMARY KEY,
    entity_id INT NOT NULL,
    attribute_id INT NOT NULL,
    value_string VARCHAR(500),
    value_number DECIMAL(15, 2),
    value_reference INT,
    array_index INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (entity_id) REFERENCES staff_entity(entity_id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_id) REFERENCES staff_attributes(attribute_id) ON DELETE CASCADE,
    INDEX idx_staff_entity_id (entity_id),
    INDEX idx_staff_attribute_id (attribute_id)
);

-- 4. Leave Requests Table
CREATE TABLE IF NOT EXISTS staff_leave_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    staff_entity_id INT NOT NULL,
    leave_type ENUM('annual', 'sick', 'maternity', 'paternity', 'unpaid', 'other') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    reviewed_by INT,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_entity_id) REFERENCES staff_entity(entity_id) ON DELETE CASCADE,
    INDEX idx_staff_leave_status (status),
    INDEX idx_staff_leave_entity (staff_entity_id)
);
