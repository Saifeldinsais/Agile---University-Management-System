require('dotenv').config();
const pool = require('../Db_config/DB');

const setupCourseAssignmentTables = async () => {
    console.log("Setting up Course Assignment (Homework) tables...\n");

    try {
        // 1. Create course_assignment_entity table
        console.log("Creating course_assignment_entity table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS course_assignment_entity (
                entity_id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT NOT NULL,
                doctor_staff_id INT NOT NULL,
                entity_type VARCHAR(50) DEFAULT 'course_assignment',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_ca_course (course_id),
                INDEX idx_ca_doctor (doctor_staff_id)
            )
        `);
        console.log("✓ course_assignment_entity created");

        // 2. Create course_assignment_attributes table
        console.log("Creating course_assignment_attributes table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS course_assignment_attributes (
                attribute_id INT AUTO_INCREMENT PRIMARY KEY,
                attribute_name VARCHAR(100) NOT NULL UNIQUE,
                attribute_type ENUM('string', 'int', 'float', 'datetime', 'text', 'boolean', 'json') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✓ course_assignment_attributes created");

        // 3. Create course_assignment_entity_attribute table
        console.log("Creating course_assignment_entity_attribute table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS course_assignment_entity_attribute (
                value_id INT AUTO_INCREMENT PRIMARY KEY,
                entity_id INT NOT NULL,
                attribute_id INT NOT NULL,
                value_string TEXT,
                value_number DECIMAL(15, 2),
                value_reference INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (entity_id) REFERENCES course_assignment_entity(entity_id) ON DELETE CASCADE,
                FOREIGN KEY (attribute_id) REFERENCES course_assignment_attributes(attribute_id) ON DELETE CASCADE,
                UNIQUE KEY unique_ca_entity_attr (entity_id, attribute_id)
            )
        `);
        console.log("✓ course_assignment_entity_attribute created");

        // 4. Insert default attributes
        console.log("\nInserting default attributes...");
        const attributes = [
            { name: "title", type: "string" },
            { name: "description", type: "text" },
            { name: "dueDate", type: "datetime" },
            { name: "totalMarks", type: "int" },
            { name: "status", type: "string" },
            { name: "updatedAt", type: "datetime" },
            { name: "attachments", type: "json" }
        ];

        for (const attr of attributes) {
            try {
                await pool.query(
                    "INSERT INTO course_assignment_attributes (attribute_name, attribute_type) VALUES (?, ?)",
                    [attr.name, attr.type]
                );
                console.log(`  ✓ ${attr.name}`);
            } catch (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    console.log(`  - ${attr.name} (already exists)`);
                } else {
                    console.error(`  ✗ Failed to create ${attr.name}:`, err.message);
                }
            }
        }

        console.log("\n✓ Course Assignment (Homework) tables setup completed!");

    } catch (error) {
        console.error("\n✗ Error setting up course assignment tables:", error.message);
    } finally {
        await pool.end();
    }
};

setupCourseAssignmentTables();
