require('dotenv').config();
const pool = require('../Db_config/DB');

async function createCourseTables() {
    try {
        console.log('📚 Creating Course EAV Tables...\n');

        // 1. Create course_entity table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS course_entity (
        entity_id INT AUTO_INCREMENT PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL DEFAULT 'course',
        entity_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_entity_type (entity_type),
        INDEX idx_entity_name (entity_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
        console.log('✅ Created table: course_entity');

        // 2. Create course_attributes table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS course_attributes (
        attribute_id INT AUTO_INCREMENT PRIMARY KEY,
        attribute_name VARCHAR(100) NOT NULL UNIQUE,
        data_type ENUM('string', 'int', 'float', 'datetime', 'text', 'boolean') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_attribute_name (attribute_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
        console.log('✅ Created table: course_attributes');

        // 3. Create course_entity_attribute table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS course_entity_attribute (
        value_id INT AUTO_INCREMENT PRIMARY KEY,
        entity_id INT NOT NULL,
        attribute_id INT NOT NULL,
        value_string VARCHAR(500),
        value_number DECIMAL(20, 4),
        value_reference INT,
        array_index INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (entity_id) REFERENCES course_entity(entity_id) ON DELETE CASCADE,
        FOREIGN KEY (attribute_id) REFERENCES course_attributes(attribute_id) ON DELETE CASCADE,
        UNIQUE KEY unique_entity_attribute (entity_id, attribute_id),
        INDEX idx_entity_id (entity_id),
        INDEX idx_attribute_id (attribute_id),
        INDEX idx_value_string (value_string(100))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
        console.log('✅ Created table: course_entity_attribute');

        // 4. Insert default course attributes
        await pool.query(`
      INSERT INTO course_attributes (attribute_name, data_type) VALUES
        ('course_code', 'string'),
        ('course_name', 'string'),
        ('description', 'text'),  
        ('credits', 'int'),
        ('department', 'string'),
        ('instructor_id', 'int'),
        ('semester', 'string'),
        ('year', 'int'),
        ('max_students', 'int'),
        ('enrolled_count', 'int')
      ON DUPLICATE KEY UPDATE attribute_name=attribute_name
    `);
        console.log('✅ Inserted default course attributes');

        console.log('\n🎉 Course tables created successfully!');
        console.log('\n📋 Table Structure:');
        console.log('   ├── course_entity (stores course entities)');
        console.log('   ├── course_attributes (defines course attributes)');
        console.log('   └── course_entity_attribute (stores attribute values)\n');

        // Show attributes
        const [attributes] = await pool.query('SELECT * FROM course_attributes');
        console.log(`✅ Available course attributes: ${attributes.length}`);
        attributes.forEach(attr => {
            console.log(`   - ${attr.attribute_name} (${attr.data_type})`);
        });
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

createCourseTables();
