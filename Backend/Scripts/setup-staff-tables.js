require("dotenv").config();

const pool = require("../Db_config/DB");

const setupStaffTables = async () => {
    console.log("Setting up Staff Module tables...\n");

    try {
        // 1. Create staff_entity table
        console.log("Creating staff_entity table...");
        await pool.query(`
      CREATE TABLE IF NOT EXISTS staff_entity (
        entity_id INT AUTO_INCREMENT PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_staff_entity_type (entity_type)
      )
    `);
        console.log("✓ staff_entity created");

        // 2. Create staff_attributes table
        console.log("Creating staff_attributes table...");
        await pool.query(`
      CREATE TABLE IF NOT EXISTS staff_attributes (
        attribute_id INT AUTO_INCREMENT PRIMARY KEY,
        attribute_name VARCHAR(100) NOT NULL UNIQUE,
        data_type ENUM('string', 'int', 'float', 'datetime', 'text', 'boolean') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_staff_attribute_name (attribute_name)
      )
    `);
        console.log("✓ staff_attributes created");

        // 3. Create staff_entity_attribute table
        console.log("Creating staff_entity_attribute table...");
        await pool.query(`
      CREATE TABLE IF NOT EXISTS staff_entity_attribute (
        value_id INT AUTO_INCREMENT PRIMARY KEY,
        entity_id INT NOT NULL,
        attribute_id INT NOT NULL,
        value_string VARCHAR(500),
        value_number DECIMAL(15, 2),
        value_reference INT,
        array_index INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (entity_id) REFERENCES staff_entity(entity_id) ON DELETE CASCADE,
        FOREIGN KEY (attribute_id) REFERENCES staff_attributes(attribute_id) ON DELETE CASCADE,
        INDEX idx_staff_entity_id (entity_id),
        INDEX idx_staff_attribute_id (attribute_id)
      )
    `);
        console.log("✓ staff_entity_attribute created");

        // 4. Create staff_leave_requests table
        console.log("Creating staff_leave_requests table...");
        await pool.query(`
      CREATE TABLE IF NOT EXISTS staff_leave_requests (
        request_id INT AUTO_INCREMENT PRIMARY KEY,
        staff_entity_id INT NOT NULL,
        leave_type ENUM('annual', 'sick', 'maternity', 'paternity', 'unpaid', 'other') NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        reviewed_by INT,
        reviewed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (staff_entity_id) REFERENCES staff_entity(entity_id) ON DELETE CASCADE,
        INDEX idx_staff_leave_status (status),
        INDEX idx_staff_leave_entity (staff_entity_id)
      )
    `);
        console.log("✓ staff_leave_requests created");

        // 5. Insert default attributes
        console.log("\nInserting default attributes...");
        const attributes = [
            { name: "email", type: "string" },
            { name: "phone", type: "string" },
            { name: "department", type: "string" },
            { name: "office_location", type: "string" },
            { name: "office_hours", type: "text" },
            { name: "assigned_courses", type: "text" },
            { name: "ta_responsibilities", type: "text" },
            { name: "supervisor_id", type: "int" },
            { name: "hire_date", type: "datetime" },
            { name: "salary", type: "float" },
            { name: "leave_balance", type: "int" },
            { name: "benefits", type: "text" },
            { name: "performance_records", type: "text" },
            { name: "research_publications", type: "text" },
            { name: "professional_development", type: "text" }
        ];

        for (const attr of attributes) {
            try {
                await pool.query(
                    "INSERT INTO staff_attributes (attribute_name, data_type) VALUES (?, ?) ON DUPLICATE KEY UPDATE attribute_name=attribute_name",
                    [attr.name, attr.type]
                );
                console.log(`  ✓ ${attr.name}`);
            } catch (err) {
                console.log(`  - ${attr.name} (already exists)`);
            }
        }

        console.log("\n✓ Staff Module setup completed successfully!");

        // Show summary
        const [tableCount] = await pool.query("SHOW TABLES LIKE 'staff%'");
        const [attrCount] = await pool.query("SELECT COUNT(*) as count FROM staff_attributes");
        console.log(`\nSummary: ${tableCount.length} tables, ${attrCount[0].count} attributes`);

    } catch (error) {
        console.error("\n✗ Error setting up staff tables:", error.message);
        process.exit(1);
    } finally {
        await pool.end();
        console.log("\nDatabase connection closed.");
    }
};

setupStaffTables();
