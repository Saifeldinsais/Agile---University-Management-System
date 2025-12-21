-- Advisor Role Database Schema
-- Links doctors/staff to departments as advisors

-- Advisor Assignments Table
-- Each advisor can only be assigned to ONE department (enforced by UNIQUE constraint)
CREATE TABLE IF NOT EXISTS advisor_assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    user_entity_id INT NOT NULL,
    department VARCHAR(100) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT,
    UNIQUE KEY unique_advisor (user_entity_id),
    INDEX idx_department (department)
);
