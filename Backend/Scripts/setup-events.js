/**
 * Setup Event Tables
 * Creates the events management system database schema
 */

require('dotenv').config();
const pool = require('../Db_config/DB');

async function setupEventTables() {
    console.log('Setting up Event Management tables...\n');

    try {
        // 1. Create event_category table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS event_category (
                category_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                color VARCHAR(7) DEFAULT '#3b82f6',
                icon VARCHAR(50) DEFAULT '📅',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Created table: event_category');

        // 2. Create event table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS event (
                event_id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                category_id INT,
                location VARCHAR(255),
                start_datetime DATETIME NOT NULL,
                end_datetime DATETIME NOT NULL,
                max_capacity INT,
                is_public BOOLEAN DEFAULT TRUE,
                target_audience ENUM('all', 'students', 'staff', 'parents') DEFAULT 'all',
                image_url VARCHAR(500),
                created_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
                FOREIGN KEY (category_id) REFERENCES event_category(category_id) ON DELETE SET NULL,
                INDEX idx_start_datetime (start_datetime),
                INDEX idx_status (status),
                INDEX idx_target (target_audience),
                INDEX idx_category (category_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Created table: event');

        // 3. Create event_rsvp table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS event_rsvp (
                rsvp_id INT AUTO_INCREMENT PRIMARY KEY,
                event_id INT NOT NULL,
                user_id INT NOT NULL,
                user_type ENUM('student', 'staff', 'parent', 'admin') NOT NULL,
                status ENUM('going', 'interested', 'not_going') DEFAULT 'interested',
                rsvp_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES event(event_id) ON DELETE CASCADE,
                UNIQUE KEY unique_rsvp (event_id, user_id),
                INDEX idx_event (event_id),
                INDEX idx_user (user_id),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Created table: event_rsvp');

        // 4. Create event_attendance table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS event_attendance (
                attendance_id INT AUTO_INCREMENT PRIMARY KEY,
                event_id INT NOT NULL,
                user_id INT NOT NULL,
                user_type ENUM('student', 'staff', 'parent', 'admin') NOT NULL,
                check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                check_out_time TIMESTAMP NULL,
                FOREIGN KEY (event_id) REFERENCES event(event_id) ON DELETE CASCADE,
                UNIQUE KEY unique_attendance (event_id, user_id),
                INDEX idx_event (event_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Created table: event_attendance');

        // 5. Insert default categories
        const [existingCategories] = await pool.query('SELECT COUNT(*) as count FROM event_category');

        if (existingCategories[0].count === 0) {
            console.log('\n📁 Creating event categories...');

            await pool.query(`
                INSERT INTO event_category (name, color, icon) VALUES
                ('Academic', '#3b82f6', '📚'),
                ('Social', '#8b5cf6', '🎉'),
                ('Sports', '#10b981', '⚽'),
                ('Workshop', '#f59e0b', '🛠️'),
                ('Seminar', '#06b6d4', '🎤'),
                ('Career', '#ec4899', '💼'),
                ('Cultural', '#f97316', '🎭'),
                ('Other', '#6b7280', '📌')
            `);
            console.log('✓ Created default categories');
        }

        // 6. Insert sample events
        const [existingEvents] = await pool.query('SELECT COUNT(*) as count FROM event');

        if (existingEvents[0].count === 0) {
            console.log('\n📅 Creating sample events...');

            // Get admin user ID
            const [admins] = await pool.query(`
                SELECT entity_id FROM entities WHERE entity_type = 'admin' LIMIT 1
            `);
            const adminId = admins[0]?.entity_id || 1;

            // Get category IDs
            const [categories] = await pool.query('SELECT category_id, name FROM event_category');
            const categoryMap = {};
            categories.forEach(c => categoryMap[c.name] = c.category_id);

            await pool.query(`
                INSERT INTO event (title, description, category_id, location, start_datetime, end_datetime, max_capacity, target_audience, created_by, status) VALUES
                ('Spring Semester Orientation', 'Welcome event for all new students. Learn about campus resources, meet faculty, and connect with fellow students.', ?, 'Main Auditorium', '2025-01-15 09:00:00', '2025-01-15 12:00:00', 500, 'students', ?, 'upcoming'),
                ('Career Fair 2025', 'Annual career fair featuring 50+ companies from various industries. Bring your resume!', ?, 'Sports Complex', '2025-02-10 10:00:00', '2025-02-10 16:00:00', 1000, 'all', ?, 'upcoming'),
                ('AI Workshop', 'Hands-on workshop on machine learning and AI fundamentals. Laptops required.', ?, 'Computer Lab 101', '2025-01-25 14:00:00', '2025-01-25 17:00:00', 30, 'students', ?, 'upcoming'),
                ('Faculty Research Seminar', 'Monthly research presentation by faculty members. This month: Dr. Ahmed on Quantum Computing.', ?, 'Conference Room A', '2025-01-20 15:00:00', '2025-01-20 17:00:00', 50, 'staff', ?, 'upcoming'),
                ('University Football Match', 'Semi-final match against rival university. Come support our team!', ?, 'University Stadium', '2025-01-18 16:00:00', '2025-01-18 18:00:00', 2000, 'all', ?, 'upcoming'),
                ('Cultural Festival', 'Celebrate diversity with performances, food, and art from around the world.', ?, 'Campus Courtyard', '2025-02-20 11:00:00', '2025-02-20 20:00:00', 1500, 'all', ?, 'upcoming')
            `, [
                categoryMap['Academic'], adminId,
                categoryMap['Career'], adminId,
                categoryMap['Workshop'], adminId,
                categoryMap['Seminar'], adminId,
                categoryMap['Sports'], adminId,
                categoryMap['Cultural'], adminId
            ]);

            console.log('✓ Created sample events');
        }

        console.log('\n✅ Event Management tables setup completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

setupEventTables();
