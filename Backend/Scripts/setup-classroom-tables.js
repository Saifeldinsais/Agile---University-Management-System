require('dotenv').config();
const pool = require('../Db_config/DB');

async function createClassroomTables() {
    try {
        console.log('🏫 Creating Classroom EAV Tables...\n');

        // 1. Create classroom_entity table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS classroom_entity (
        entity_id INT AUTO_INCREMENT PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL DEFAULT 'classroom',
        entity_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_entity_type (entity_type),
        INDEX idx_entity_name (entity_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
        console.log('✅ Created table: classroom_entity');

        // 2. Create classroom_attributes table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS classroom_attributes (
        attribute_id INT AUTO_INCREMENT PRIMARY KEY,
        attribute_name VARCHAR(100) NOT NULL UNIQUE,
        data_type ENUM('string', 'int', 'float', 'datetime', 'text', 'boolean') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_attribute_name (attribute_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
        console.log('✅ Created table: classroom_attributes');

        // 3. Create classroom_entity_attribute table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS classroom_entity_attribute (
        value_id INT AUTO_INCREMENT PRIMARY KEY,
        entity_id INT NOT NULL,
        attribute_id INT NOT NULL,
        value_string VARCHAR(500),
        value_number DECIMAL(20, 4),
        value_reference INT,
        array_index INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (entity_id) REFERENCES classroom_entity(entity_id) ON DELETE CASCADE,
        FOREIGN KEY (attribute_id) REFERENCES classroom_attributes(attribute_id) ON DELETE CASCADE,
        INDEX idx_entity_id (entity_id),
        INDEX idx_attribute_id (attribute_id),
        INDEX idx_value_string (value_string(100))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
        console.log('✅ Created table: classroom_entity_attribute');

        // 4. Insert default classroom attributes
        await pool.query(`
      INSERT INTO classroom_attributes (attribute_name, data_type) VALUES
        ('roomName', 'string'),
        ('capacity', 'int'),
        ('type', 'string'),
        ('isworking', 'string'),
        ('timeslot', 'string'),
        ('booking', 'string'),
        ('building', 'string'),
        ('floor', 'int'),
        ('equipment', 'string')
      ON DUPLICATE KEY UPDATE attribute_name=attribute_name
    `);
        console.log('✅ Inserted default classroom attributes');

        console.log('\n🎉 Classroom tables created successfully!');
        console.log('\n📋 Table Structure:');
        console.log('   ├── classroom_entity (stores classroom records)');
        console.log('   ├── classroom_attributes (defines classroom attributes)');
        console.log('   └── classroom_entity_attribute (stores attribute values)\n');

        // Show attributes
        const [attributes] = await pool.query('SELECT * FROM classroom_attributes');
        console.log(`✅ Available classroom attributes: ${attributes.length}`);
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

createClassroomTables();
