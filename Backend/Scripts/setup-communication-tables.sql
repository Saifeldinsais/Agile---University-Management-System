-- =====================================================
-- Student-Staff Communication Module
-- Database Schema (EAV-Compatible)
-- =====================================================

-- 1. Conversation threads between students and staff
CREATE TABLE IF NOT EXISTS student_staff_conversation (
    conversation_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    staff_id INT NOT NULL,
    staff_type ENUM('doctor', 'ta', 'advisor') NOT NULL,
    subject VARCHAR(255),
    status ENUM('active', 'archived') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (student_id) REFERENCES entities(entity_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff_entity(entity_id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_student_id (student_id),
    INDEX idx_staff_id (staff_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    
    -- Unique constraint to prevent duplicate conversations
    UNIQUE KEY unique_conversation (student_id, staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Messages within conversations
CREATE TABLE IF NOT EXISTS student_staff_message (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_type ENUM('student', 'staff') NOT NULL,
    sender_id INT NOT NULL,
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key
    FOREIGN KEY (conversation_id) REFERENCES student_staff_conversation(conversation_id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_sender (sender_type, sender_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Meeting requests with approval workflow
CREATE TABLE IF NOT EXISTS meeting_request (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    staff_id INT NOT NULL,
    staff_type ENUM('doctor', 'ta', 'advisor') NOT NULL,
    purpose TEXT NOT NULL,
    proposed_date DATE NOT NULL,
    proposed_time TIME NOT NULL,
    duration_minutes INT DEFAULT 30,
    status ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
    staff_notes TEXT,
    location VARCHAR(255),
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (student_id) REFERENCES entities(entity_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff_entity(entity_id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_student_id (student_id),
    INDEX idx_staff_id (staff_id),
    INDEX idx_status (status),
    INDEX idx_proposed_date (proposed_date),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Academic guidance messages (advisor-specific)
CREATE TABLE IF NOT EXISTS academic_guidance (
    guidance_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    advisor_id INT NOT NULL,
    guidance_type ENUM('course_selection', 'career', 'academic_warning', 'general') DEFAULT 'general',
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (student_id) REFERENCES entities(entity_id) ON DELETE CASCADE,
    FOREIGN KEY (advisor_id) REFERENCES staff_entity(entity_id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_student_id (student_id),
    INDEX idx_advisor_id (advisor_id),
    INDEX idx_guidance_type (guidance_type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Message attachments (optional, for file sharing)
CREATE TABLE IF NOT EXISTS message_attachment (
    attachment_id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key
    FOREIGN KEY (message_id) REFERENCES student_staff_message(message_id) ON DELETE CASCADE,
    
    -- Index
    INDEX idx_message_id (message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
