require('dotenv').config();
const pool = require('../Db_config/DB');

async function setupTables() {
    console.log('Setting up Course Resources and Schedule tables...\n');

    try {
        // Course Resources Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS course_resources (
                resource_id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT NOT NULL,
                doctor_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                file_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(512) NOT NULL,
                file_type VARCHAR(100),
                file_size BIGINT,
                upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                INDEX idx_course (course_id),
                INDEX idx_doctor (doctor_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Created table: course_resources');

        // Course Schedule Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS course_schedule (
                schedule_id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT NOT NULL,
                doctor_id INT NOT NULL,
                day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                room_name VARCHAR(100),
                classroom_id INT,
                semester VARCHAR(50),
                is_active BOOLEAN DEFAULT TRUE,
                INDEX idx_course (course_id),
                INDEX idx_doctor (doctor_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Created table: course_schedule');

        console.log('\n✅ Tables setup completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

setupTables();
