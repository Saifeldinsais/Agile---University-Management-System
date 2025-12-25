/**
 * Setup Parent Portal Tables
 * Run this script to create all parent-related EAV tables
 */

require('dotenv').config();
const pool = require('../Db_config/DB');

async function setupParentTables() {
    console.log('Setting up Parent Portal tables...\n');

    try {
        // 1. Create parent_entity table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS parent_entity (
                entity_id INT AUTO_INCREMENT PRIMARY KEY,
                entity_type VARCHAR(50) NOT NULL DEFAULT 'parent',
                entity_name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_entity_type (entity_type),
                INDEX idx_entity_name (entity_name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Created table: parent_entity');

        // 2. Create parent_attributes table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS parent_attributes (
                attribute_id INT AUTO_INCREMENT PRIMARY KEY,
                attribute_name VARCHAR(100) NOT NULL UNIQUE,
                data_type ENUM('string', 'int', 'float', 'datetime', 'text', 'boolean') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_attribute_name (attribute_name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Created table: parent_attributes');

        // 3. Create parent_entity_attribute table
        await pool.query(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Created table: parent_entity_attribute');

        // 4. Create parent_student_link table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS parent_student_link (
                link_id INT AUTO_INCREMENT PRIMARY KEY,
                parent_id INT NOT NULL,
                student_id INT NOT NULL,
                relationship VARCHAR(50) DEFAULT 'parent',
                link_status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (parent_id) REFERENCES parent_entity(entity_id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES entities(entity_id) ON DELETE CASCADE,
                UNIQUE KEY unique_parent_student (parent_id, student_id),
                INDEX idx_parent_id (parent_id),
                INDEX idx_student_id (student_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Created table: parent_student_link');

        // 5. Create parent_teacher_message table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS parent_teacher_message (
                message_id INT AUTO_INCREMENT PRIMARY KEY,
                parent_id INT NOT NULL,
                teacher_id INT NOT NULL,
                student_id INT NOT NULL,
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Created table: parent_teacher_message');

        // 6. Create parent_announcement table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS parent_announcement (
                announcement_id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
                target_type ENUM('all', 'specific') DEFAULT 'all',
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME,
                INDEX idx_priority (priority),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Created table: parent_announcement');

        // 7. Create parent_announcement_read table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS parent_announcement_read (
                id INT AUTO_INCREMENT PRIMARY KEY,
                announcement_id INT NOT NULL,
                parent_id INT NOT NULL,
                read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (announcement_id) REFERENCES parent_announcement(announcement_id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES parent_entity(entity_id) ON DELETE CASCADE,
                UNIQUE KEY unique_announcement_parent (announcement_id, parent_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Created table: parent_announcement_read');

        // 8. Create student_attendance table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS student_attendance (
                attendance_id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                course_id INT NOT NULL,
                attendance_date DATE NOT NULL,
                status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
                remarks TEXT,
                recorded_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES entities(entity_id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES course_entity(entity_id) ON DELETE CASCADE,
                UNIQUE KEY unique_student_course_date (student_id, course_id, attendance_date),
                INDEX idx_student_id (student_id),
                INDEX idx_course_id (course_id),
                INDEX idx_date (attendance_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Created table: student_attendance');

        // 9. Create student_remarks table
        await pool.query(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Created table: student_remarks');

        // 10. Insert default parent attributes
        const attributes = [
            ['email', 'string'],
            ['password', 'string'],
            ['full_name', 'string'],
            ['phone', 'string'],
            ['address', 'text'],
            ['occupation', 'string'],
            ['relationship', 'string'],
            ['notification_preference', 'string'],
            ['user_id', 'int']
        ];

        for (const [name, type] of attributes) {
            await pool.query(
                `INSERT INTO parent_attributes (attribute_name, data_type) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE attribute_name=attribute_name`,
                [name, type]
            );
        }
        console.log('✓ Inserted default parent attributes');

        // Verify tables were created
        const [tables] = await pool.query(`
            SELECT TABLE_NAME FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'university_management' 
            AND TABLE_NAME LIKE 'parent%'
        `);

        console.log('\n--- Parent Portal Tables ---');
        tables.forEach(t => console.log(`  • ${t.TABLE_NAME}`));

        // Verify attributes
        const [attrs] = await pool.query('SELECT * FROM parent_attributes');
        console.log('\n--- Parent Attributes ---');
        attrs.forEach(a => console.log(`  • ${a.attribute_name} (${a.data_type})`));

        console.log('\n✅ Parent Portal setup completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

setupParentTables();
