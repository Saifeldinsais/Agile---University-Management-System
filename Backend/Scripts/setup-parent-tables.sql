-- Parent-Teacher Portal EAV Tables
-- This creates tables for parent entity management, messaging, and announcements

USE university_management;

-- ============================================
-- 1. Parent Entity Table (stores parent records)
-- ============================================
CREATE TABLE IF NOT EXISTS parent_entity (
    entity_id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL DEFAULT 'parent',
    entity_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_entity_type (entity_type),
    INDEX idx_entity_name (entity_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 2. Parent Attributes Table (defines parent attributes)
-- ============================================
CREATE TABLE IF NOT EXISTS parent_attributes (
    attribute_id INT AUTO_INCREMENT PRIMARY KEY,
    attribute_name VARCHAR(100) NOT NULL UNIQUE,
    data_type ENUM('string', 'int', 'float', 'datetime', 'text', 'boolean') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_attribute_name (attribute_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 3. Parent Entity Attribute Values Table (stores attribute values)
-- ============================================
CREATE TABLE IF NOT EXISTS parent_entity_attribute (
    value_id INT AUTO_INCREMENT PRIMARY KEY,
    entity_id INT NOT NULL,
    attribute_id INT NOT NULL,
    value_string VARCHAR(500),
    value_number DECIMAL(20, 4),
    value_reference INT,
    array_index INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (entity_id) REFERENCES parent_entity(entity_id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_id) REFERENCES parent_attributes(attribute_id) ON DELETE CASCADE,
    INDEX idx_entity_id (entity_id),
    INDEX idx_attribute_id (attribute_id),
    INDEX idx_value_string (value_string(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 4. Parent-Student Link Table (links parents to students)
-- ============================================
CREATE TABLE IF NOT EXISTS parent_student_link (
    link_id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    student_id INT NOT NULL,
    relationship VARCHAR(50) DEFAULT 'parent', -- parent, guardian, mother, father
    link_status VARCHAR(20) DEFAULT 'active', -- active, inactive
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES parent_entity(entity_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES entities(entity_id) ON DELETE CASCADE,
    UNIQUE KEY unique_parent_student (parent_id, student_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 5. Parent-Teacher Messages Table
-- ============================================
CREATE TABLE IF NOT EXISTS parent_teacher_message (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    teacher_id INT NOT NULL, -- References staff_entity (doctor/professor)
    student_id INT NOT NULL, -- Context: which student is the message about
    sender_type ENUM('parent', 'teacher') NOT NULL,
    subject VARCHAR(255),
    message_body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES parent_entity(entity_id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES staff_entity(entity_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES entities(entity_id) ON DELETE CASCADE,
    INDEX idx_parent_id (parent_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 6. Parent Announcements Table
-- ============================================
CREATE TABLE IF NOT EXISTS parent_announcement (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    target_type ENUM('all', 'specific') DEFAULT 'all', -- all parents or specific
    created_by INT, -- Admin who created the announcement
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    INDEX idx_priority (priority),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 7. Parent Announcement Read Status Table
-- ============================================
CREATE TABLE IF NOT EXISTS parent_announcement_read (
    id INT AUTO_INCREMENT PRIMARY KEY,
    announcement_id INT NOT NULL,
    parent_id INT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (announcement_id) REFERENCES parent_announcement(announcement_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES parent_entity(entity_id) ON DELETE CASCADE,
    UNIQUE KEY unique_announcement_parent (announcement_id, parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 8. Student Attendance Table (for parent viewing)
-- ============================================
CREATE TABLE IF NOT EXISTS student_attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
    remarks TEXT,
    recorded_by INT, -- Teacher/TA who recorded
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES entities(entity_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES course_entity(entity_id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_course_date (student_id, course_id, attendance_date),
    INDEX idx_student_id (student_id),
    INDEX idx_course_id (course_id),
    INDEX idx_date (attendance_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 9. Student Remarks Table (teacher comments)
-- ============================================
CREATE TABLE IF NOT EXISTS student_remarks (
    remark_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    teacher_id INT NOT NULL,
    remark_type ENUM('academic', 'behavioral', 'general', 'praise') DEFAULT 'general',
    remark_text TEXT NOT NULL,
    is_visible_to_parent BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES entities(entity_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES course_entity(entity_id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES staff_entity(entity_id) ON DELETE CASCADE,
    INDEX idx_student_id (student_id),
    INDEX idx_parent_visible (is_visible_to_parent)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Insert default parent attributes
-- ============================================
INSERT INTO parent_attributes (attribute_name, data_type) VALUES
    ('email', 'string'),
    ('password', 'string'),
    ('full_name', 'string'),
    ('phone', 'string'),
    ('address', 'text'),
    ('occupation', 'string'),
    ('relationship', 'string'),
    ('notification_preference', 'string'),
    ('user_id', 'int')
ON DUPLICATE KEY UPDATE attribute_name=attribute_name;

-- ============================================
-- Success message
-- ============================================
SELECT 'Parent Portal EAV tables created successfully!' AS message;
SELECT COUNT(*) AS total_parent_attributes FROM parent_attributes;
