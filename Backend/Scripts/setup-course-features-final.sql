-- ============================================================================
-- COURSE FEATURES SETUP - FINAL VERSION
-- Only the tables actually used in the application
-- ============================================================================

-- ============================================================================
-- 1. COURSE RESOURCES TABLE
-- Stores uploaded course materials (PDFs, documents, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS course_resources (
    resource_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    doctor_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'Other',
    categoryDescription TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size INT,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_course_id (course_id),
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_upload_date (upload_date)
);

-- ============================================================================
-- 2. COURSE SCHEDULE TABLE
-- Stores course schedule (class times, days, rooms)
-- ============================================================================
CREATE TABLE IF NOT EXISTS course_schedule (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    doctor_id INT NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    classroom_id INT,
    room_name VARCHAR(100),
    semester VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_course_id (course_id),
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_day (day_of_week)
);

-- ============================================================================
-- ASSIGNMENT_ENTITY TABLE (Pre-existing, stores course staff assignments)
-- This is where the admin interface stores course staff assignments
-- ============================================================================
-- Schema reference:
-- - entity_id: INT PRIMARY KEY AUTO_INCREMENT
-- - entity_type: VARCHAR(50) - "assignment"
-- - entity_name: VARCHAR(255) - e.g., "Assignment_courseId_staffId"
-- - course_id: INT - The course being assigned
-- - staff_id: INT - The staff member being assigned
-- - created_at: TIMESTAMP
-- - updated_at: TIMESTAMP

-- ============================================================================
-- ASSIGNMENT_ENTITY_ATTRIBUTE TABLE (Pre-existing)
-- Stores attributes of assignments (role, department, status, notes)
-- ============================================================================
-- Schema reference:
-- - attribute_value_id: INT PRIMARY KEY AUTO_INCREMENT
-- - entity_id: INT - Foreign key to assignment_entity
-- - attribute_id: INT - Foreign key to assignment_attributes
-- - value_string: TEXT
-- - created_at: TIMESTAMP

-- ============================================================================
-- ASSIGNMENT_ATTRIBUTES TABLE (Pre-existing)
-- Defines available assignment attributes
-- ============================================================================
-- Schema reference:
-- - attribute_id: INT PRIMARY KEY AUTO_INCREMENT
-- - attribute_name: VARCHAR(100) - "role", "department", "status", "notes", "assigned_date"
-- - attribute_type: VARCHAR(50) - "string", "datetime", "text"
-- - created_at: TIMESTAMP

-- ============================================================================
-- STAFF_ENTITY TABLE (Pre-existing, stores staff records)
-- ============================================================================
-- Schema reference:
-- - entity_id: INT PRIMARY KEY AUTO_INCREMENT
-- - entity_type: VARCHAR(50) - "staff"
-- - entity_name: VARCHAR(255)
-- - created_at: TIMESTAMP

-- ============================================================================
-- STAFF_ENTITY_ATTRIBUTE TABLE (Pre-existing)
-- Stores staff attributes (name, email, phone, department, role, etc.)
-- ============================================================================
-- Schema reference:
-- - attribute_value_id: INT PRIMARY KEY AUTO_INCREMENT
-- - entity_id: INT - Foreign key to staff_entity
-- - attribute_id: INT - Foreign key to staff_attributes
-- - value_string: TEXT
-- - created_at: TIMESTAMP

-- ============================================================================
-- STAFF_ATTRIBUTES TABLE (Pre-existing)
-- Defines available staff attributes
-- ============================================================================
-- Schema reference:
-- - attribute_id: INT PRIMARY KEY AUTO_INCREMENT
-- - attribute_name: VARCHAR(100) - "name", "email", "phone", "department", "role", "bio", etc.
-- - attribute_type: VARCHAR(50) - "string", "text"
-- - created_at: TIMESTAMP

-- ============================================================================
-- COURSE_ENTITY TABLE (Pre-existing, stores course records)
-- ============================================================================
-- Schema reference:
-- - entity_id: INT PRIMARY KEY AUTO_INCREMENT
-- - entity_type: VARCHAR(50) - "course"
-- - entity_name: VARCHAR(255) - Course name
-- - created_at: TIMESTAMP

-- ============================================================================
-- TABLE RELATIONSHIPS
-- ============================================================================
-- course_resources -> course_entity (via course_id)
-- course_schedule -> course_entity (via course_id)
-- assignment_entity -> course_entity (via course_id)
-- assignment_entity -> staff_entity (via staff_id)
-- assignment_entity_attribute -> assignment_entity (via entity_id)
-- assignment_entity_attribute -> assignment_attributes (via attribute_id)
-- staff_entity_attribute -> staff_entity (via entity_id)
-- staff_entity_attribute -> staff_attributes (via attribute_id)

-- ============================================================================
-- API ENDPOINTS THAT USE THESE TABLES
-- ============================================================================
-- GET  /api/doctor/courses/:courseId/resources
--   Queries: course_resources WHERE course_id = ?
--
-- POST /api/doctor/courses/:courseId/resources/upload
--   Inserts: course_resources
--
-- GET  /api/doctor/courses/:courseId/staff
--   Queries: assignment_entity WHERE course_id = ? 
--   Then: assignment_entity_attribute for role
--   Then: staff_entity_attribute for name, email
--
-- GET  /api/doctor/courses/:courseId/schedule/:doctorId
--   Queries: course_schedule WHERE course_id = ? AND doctor_id = ?

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. course_staff table is NOT used - deleted to avoid confusion
-- 2. All staff assignments come from assignment_entity (admin interface)
-- 3. All staff details come from staff_entity_attribute (EAV model)
-- 4. Course resources are stored in course_resources table with category grouping
-- 5. Course schedules are stored in course_schedule table
-- 6. Resources can be grouped by category (Lectures, Tutorials, etc.)
-- ============================================================================
