-- Course Resources, Staff Assignments, and Schedule Tables
-- This creates tables for managing course materials, assigned staff, and course schedules

USE university_management;

-- ========== COURSE RESOURCES TABLE ==========
-- Stores course materials, PDFs, and learning resources uploaded by doctors
CREATE TABLE IF NOT EXISTS course_resources (
    resource_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    doctor_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_type VARCHAR(50),  -- 'pdf', 'doc', 'image', 'video', etc.
    file_size INT,          -- in bytes
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_course_id (course_id),
    INDEX idx_doctor_id (doctor_id),
    FOREIGN KEY (course_id) REFERENCES course_entity(entity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== COURSE STAFF ASSIGNMENTS TABLE ==========
-- Stores the relationship between courses and staff members (TAs)
CREATE TABLE IF NOT EXISTS course_staff (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    staff_id INT NOT NULL,
    doctor_id INT NOT NULL,  -- The doctor who teaches the course
    role VARCHAR(50),        -- 'teaching_assistant', 'lab_instructor', etc.
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    UNIQUE KEY unique_course_staff (course_id, staff_id),
    INDEX idx_course_id (course_id),
    INDEX idx_staff_id (staff_id),
    INDEX idx_doctor_id (doctor_id),
    FOREIGN KEY (course_id) REFERENCES course_entity(entity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== COURSE SCHEDULE TABLE ==========
-- Stores scheduled class times for courses assigned to specific doctors
CREATE TABLE IF NOT EXISTS course_schedule (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    doctor_id INT NOT NULL,
    day_of_week VARCHAR(20),  -- 'Monday', 'Tuesday', etc.
    start_time TIME,          -- e.g., '10:00:00'
    end_time TIME,            -- e.g., '11:30:00'
    classroom_id INT,         -- Reference to classroom (optional)
    room_name VARCHAR(100),   -- e.g., 'Room 101', 'Lab A'
    semester VARCHAR(20),     -- e.g., 'Spring 2024'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_course_id (course_id),
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_day (day_of_week),
    FOREIGN KEY (course_id) REFERENCES course_entity(entity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample data for testing (optional)
-- INSERT INTO course_resources (course_id, doctor_id, title, description, file_type) VALUES
-- (1, 1, 'Lecture Slides Week 1', 'Introduction and Overview', 'pdf'),
-- (1, 1, 'Lab Instructions', 'Setup and Installation Guide', 'pdf');

-- INSERT INTO course_staff (course_id, staff_id, doctor_id, role) VALUES
-- (1, 1, 1, 'teaching_assistant'),
-- (1, 2, 1, 'lab_instructor');

-- INSERT INTO course_schedule (course_id, doctor_id, day_of_week, start_time, end_time, room_name) VALUES
-- ('Monday', '10:00:00', '11:30:00', 'Room 101'),
-- ('Wednesday', '14:00:00', '15:30:00', 'Room 101');

SELECT 'Course resources, staff, and schedule tables created successfully!' AS message;
