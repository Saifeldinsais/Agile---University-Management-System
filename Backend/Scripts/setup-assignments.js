require('dotenv').config();

const pool = require('../Db_config/DB');

const initializeAssignmentTables = async () => {
  try {
    console.log('DB ENV:', {
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD ? '***' : undefined,
      db: process.env.MYSQL_DBNAME,
    });
    console.log('Starting Assignment Tables Setup...\n');

    // 1. Create assignment_entity table
    console.log('Creating assignment_entity table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assignment_entity (
        entity_id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT NOT NULL,
        staff_id INT NOT NULL,
        entity_type VARCHAR(50) NOT NULL DEFAULT 'assignment',
        entity_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_entity_type (entity_type),
        INDEX idx_course_id (course_id),
        INDEX idx_staff_id (staff_id),
        UNIQUE KEY unique_course_staff (course_id, staff_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ assignment_entity table created');

    // 2. Create assignment_attributes table
    console.log('Creating assignment_attributes table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assignment_attributes (
        attribute_id INT AUTO_INCREMENT PRIMARY KEY,
        attribute_name VARCHAR(100) NOT NULL UNIQUE,
        attribute_type ENUM('string', 'int', 'float', 'datetime', 'text', 'boolean') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_attribute_name (attribute_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ assignment_attributes table created');

    // 3. Create assignment_entity_attribute table
    console.log('Creating assignment_entity_attribute table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assignment_entity_attribute (
        value_id INT AUTO_INCREMENT PRIMARY KEY,
        entity_id INT NOT NULL,
        attribute_id INT NOT NULL,
        value_string VARCHAR(500),
        value_number DECIMAL(20, 4),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (entity_id) REFERENCES assignment_entity(entity_id) ON DELETE CASCADE,
        FOREIGN KEY (attribute_id) REFERENCES assignment_attributes(attribute_id) ON DELETE CASCADE,
        UNIQUE KEY unique_entity_attribute (entity_id, attribute_id),
        INDEX idx_entity_id (entity_id),
        INDEX idx_attribute_id (attribute_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ assignment_entity_attribute table created');

    // 4. Insert default attributes
    console.log('Inserting default attributes...');
    const attributes = [
      { name: 'role', type: 'string' },
      { name: 'department', type: 'string' },
      { name: 'status', type: 'string' },
      { name: 'assigned_date', type: 'datetime' },
      { name: 'notes', type: 'text' },
    ];

    for (const attr of attributes) {
      try {
        await pool.query(
          'INSERT INTO assignment_attributes (attribute_name, attribute_type) VALUES (?, ?)',
          [attr.name, attr.type]
        );
        console.log(`  ✓ Created attribute: ${attr.name}`);
      } catch (e) {
        // Attribute might already exist, which is fine
        if (!e.message.includes('Duplicate entry')) {
          throw e;
        }
      }
    }

    console.log('\n✓ Assignment Tables Setup Complete!\n');
    console.log('Summary:');
    console.log('  - assignment_entity table created');
    console.log('  - assignment_attributes table created');
    console.log('  - assignment_entity_attribute table created');
    console.log('  - Default attributes inserted\n');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error setting up assignment tables:', error.message);
    process.exit(1);
  }
};

initializeAssignmentTables();
