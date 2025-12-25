/**
 * Setup Announcement Tables
 * Creates the centralized announcements system database schema
 */

require('dotenv').config();
const pool = require('../Db_config/DB');

async function setupAnnouncementTables() {
    console.log('Setting up Announcement tables...\n');

    try {
        // 1. Create main announcement table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS announcement (
                announcement_id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
                target_audience ENUM('all', 'students', 'parents', 'staff', 'custom') DEFAULT 'all',
                deadline DATETIME NULL,
                is_pinned BOOLEAN DEFAULT FALSE,
                created_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                expires_at DATETIME NULL,
                status ENUM('draft', 'published', 'archived') DEFAULT 'published',
                INDEX idx_target (target_audience),
                INDEX idx_priority (priority),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at),
                INDEX idx_pinned (is_pinned)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Created table: announcement');

        // 2. Create read tracking table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS announcement_read (
                id INT AUTO_INCREMENT PRIMARY KEY,
                announcement_id INT NOT NULL,
                user_id INT NOT NULL,
                user_type ENUM('student', 'parent', 'staff', 'admin') NOT NULL,
                read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (announcement_id) REFERENCES announcement(announcement_id) ON DELETE CASCADE,
                UNIQUE KEY unique_read (announcement_id, user_id),
                INDEX idx_user (user_id),
                INDEX idx_announcement (announcement_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Created table: announcement_read');

        // 3. Create custom targeting table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS announcement_target (
                id INT AUTO_INCREMENT PRIMARY KEY,
                announcement_id INT NOT NULL,
                target_type ENUM('course', 'department', 'role', 'user') NOT NULL,
                target_id INT NULL,
                target_value VARCHAR(100) NULL,
                FOREIGN KEY (announcement_id) REFERENCES announcement(announcement_id) ON DELETE CASCADE,
                INDEX idx_announcement (announcement_id),
                INDEX idx_type (target_type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Created table: announcement_target');

        // 4. Insert sample announcements
        const [existingAnnouncements] = await pool.query('SELECT COUNT(*) as count FROM announcement');

        if (existingAnnouncements[0].count === 0) {
            console.log('\n📢 Creating sample announcements...');

            // Get admin user ID (first admin)
            const [admins] = await pool.query(`
                SELECT entity_id FROM entities WHERE entity_type = 'admin' LIMIT 1
            `);
            const adminId = admins[0]?.entity_id || 1;

            // Sample announcements
            await pool.query(`
                INSERT INTO announcement (title, content, priority, target_audience, is_pinned, created_by) VALUES
                ('Welcome to Spring Semester 2025', 'Welcome back, students! We hope you had a restful break. Classes begin on January 15th. Please check your course schedule and make sure to complete registration by January 10th.', 'high', 'all', true, ?),
                ('Library Extended Hours During Finals', 'The university library will be open 24/7 during the finals period (January 15-25). Study rooms can be reserved online through the student portal.', 'normal', 'students', false, ?),
                ('Parent-Teacher Conference Schedule', 'Parent-teacher conferences will be held on February 5th and 6th. Please sign up through the parent portal to select your preferred time slots.', 'normal', 'parents', false, ?),
                ('Faculty Meeting - Curriculum Updates', 'All faculty members are required to attend the curriculum review meeting on January 20th at 2:00 PM in the main auditorium.', 'high', 'staff', false, ?),
                ('Campus Maintenance Notice', 'The main parking lot will be closed for maintenance on January 12th. Please use alternate parking areas.', 'low', 'all', false, ?)
            `, [adminId, adminId, adminId, adminId, adminId]);

            console.log('✓ Created sample announcements');
        }

        console.log('\n✅ Announcement tables setup completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

setupAnnouncementTables();
