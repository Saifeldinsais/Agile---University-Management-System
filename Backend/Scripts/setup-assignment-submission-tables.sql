USE university_management;

CREATE TABLE IF NOT EXISTS assignment_submission_entity (
    entity_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    assignment_id INT NOT NULL,
    entity_type VARCHAR(50) NOT NULL DEFAULT 'assignment_submission',
    entity_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_entity_type (entity_type),
    INDEX idx_student_id (student_id),
    INDEX idx_assignment_id (assignment_id),
    UNIQUE KEY unique_student_assignment (student_id, assignment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS assignment_submission_attributes (
    attribute_id INT AUTO_INCREMENT PRIMARY KEY,
    attribute_name VARCHAR(100) NOT NULL UNIQUE,
    attribute_type ENUM('string', 'int', 'float', 'datetime', 'text', 'boolean') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_attribute_name (attribute_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS assignment_submission_entity_attribute (
    value_id INT AUTO_INCREMENT PRIMARY KEY,
    entity_id INT NOT NULL,
    attribute_id INT NOT NULL,
    value_string VARCHAR(500),
    value_number DECIMAL(20, 4),
    value_datetime DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (entity_id) REFERENCES assignment_submission_entity(entity_id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_id) REFERENCES assignment_submission_attributes(attribute_id) ON DELETE CASCADE,
    UNIQUE KEY unique_entity_attribute (entity_id, attribute_id),
    INDEX idx_entity_id (entity_id),
    INDEX idx_attribute_id (attribute_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS assignment_submission_files (
    file_id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES assignment_submission_entity(entity_id) ON DELETE CASCADE,
    INDEX idx_submission_id (submission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO assignment_submission_attributes (attribute_name, attribute_type) VALUES
    ('submission_status', 'string'),
    ('submitted_date', 'datetime'),
    ('last_updated', 'datetime'),
    ('grade', 'float'),
    ('feedback', 'text'),
    ('is_late', 'boolean')
ON DUPLICATE KEY UPDATE attribute_name=attribute_name;

SELECT 'Assignment Submission tables created successfully!' AS message;
