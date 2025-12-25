/**
 * Setup Communication Tables
 * Run this script to create all student-staff communication tables
 */

require('dotenv').config();
const pool = require('../Db_config/DB');

async function setupCommunicationTables() {
    console.log('Setting up Student-Staff Communication tables...\n');

    try {
        // 1. Create conversation table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS student_staff_conversation (
                conversation_id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                staff_id INT NOT NULL,
                staff_type ENUM('doctor', 'ta', 'advisor') NOT NULL,
                subject VARCHAR(255),
                status ENUM('active', 'archived') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES entities(entity_id) ON DELETE CASCADE,
                FOREIGN KEY (staff_id) REFERENCES staff_entity(entity_id) ON DELETE CASCADE,
                INDEX idx_student_id (student_id),
                INDEX idx_staff_id (staff_id),
                INDEX idx_status (status),
                UNIQUE KEY unique_conversation (student_id, staff_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Created table: student_staff_conversation');

        // 2. Create messages table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS student_staff_message (
                message_id INT AUTO_INCREMENT PRIMARY KEY,
                conversation_id INT NOT NULL,
                sender_type ENUM('student', 'staff') NOT NULL,
                sender_id INT NOT NULL,
                message_text TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES student_staff_conversation(conversation_id) ON DELETE CASCADE,
                INDEX idx_conversation_id (conversation_id),
                INDEX idx_is_read (is_read)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Created table: student_staff_message');

        // 3. Create meeting requests table
        await pool.query(`
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
                FOREIGN KEY (student_id) REFERENCES entities(entity_id) ON DELETE CASCADE,
                FOREIGN KEY (staff_id) REFERENCES staff_entity(entity_id) ON DELETE CASCADE,
                INDEX idx_student_id (student_id),
                INDEX idx_staff_id (staff_id),
                INDEX idx_status (status),
                INDEX idx_proposed_date (proposed_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Created table: meeting_request');

        // 4. Create academic guidance table
        await pool.query(`
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
                FOREIGN KEY (student_id) REFERENCES entities(entity_id) ON DELETE CASCADE,
                FOREIGN KEY (advisor_id) REFERENCES staff_entity(entity_id) ON DELETE CASCADE,
                INDEX idx_student_id (student_id),
                INDEX idx_advisor_id (advisor_id),
                INDEX idx_is_read (is_read)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Created table: academic_guidance');

        // 5. Create message attachments table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS message_attachment (
                attachment_id INT AUTO_INCREMENT PRIMARY KEY,
                message_id INT NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_type VARCHAR(100),
                file_size INT,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (message_id) REFERENCES student_staff_message(message_id) ON DELETE CASCADE,
                INDEX idx_message_id (message_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Created table: message_attachment');

        // Verify tables
        const [tables] = await pool.query(`
            SELECT TABLE_NAME FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME IN ('student_staff_conversation', 'student_staff_message', 
                               'meeting_request', 'academic_guidance', 'message_attachment')
        `);

        console.log('\n--- Communication Tables Created ---');
        tables.forEach(t => console.log(`  • ${t.TABLE_NAME}`));

        console.log('\n✅ Student-Staff Communication setup completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

setupCommunicationTables();
