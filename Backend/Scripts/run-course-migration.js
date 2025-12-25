require('dotenv').config();
const pool = require('./Db_config/DB');

async function runMigration() {
  try {
    console.log('Running course resources, staff, and schedule migration...');
    
    // Execute each CREATE TABLE statement
    const statements = [
      // Course Resources Table
      `CREATE TABLE IF NOT EXISTS course_resources (
        resource_id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT NOT NULL,
        doctor_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_name VARCHAR(255),
        file_path VARCHAR(500),
        file_type VARCHAR(50),
        file_size INT,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        INDEX idx_course_id (course_id),
        INDEX idx_doctor_id (doctor_id),
        FOREIGN KEY (course_id) REFERENCES course_entity(entity_id) ON DELETE CASCADE
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      // Course Staff Table
      `CREATE TABLE IF NOT EXISTS course_staff (
        assignment_id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT NOT NULL,
        staff_id INT NOT NULL,
        doctor_id INT NOT NULL,
        role VARCHAR(50),
        assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        UNIQUE KEY unique_course_staff (course_id, staff_id),
        INDEX idx_course_id (course_id),
        INDEX idx_staff_id (staff_id),
        INDEX idx_doctor_id (doctor_id),
        FOREIGN KEY (course_id) REFERENCES course_entity(entity_id) ON DELETE CASCADE
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      // Course Schedule Table
      `CREATE TABLE IF NOT EXISTS course_schedule (
        schedule_id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT NOT NULL,
        doctor_id INT NOT NULL,
        day_of_week VARCHAR(20),
        start_time TIME,
        end_time TIME,
        classroom_id INT,
        room_name VARCHAR(100),
        semester VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_course_id (course_id),
        INDEX idx_doctor_id (doctor_id),
        INDEX idx_day (day_of_week),
        FOREIGN KEY (course_id) REFERENCES course_entity(entity_id) ON DELETE CASCADE
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    ];
    
    for (const statement of statements) {
      await pool.query(statement);
      const tableName = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/)[1];
      console.log(`✓ Created/verified table: ${tableName}`);
    }
    
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

runMigration();
