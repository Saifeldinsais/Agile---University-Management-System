require("dotenv").config();

const pool = require("../Db_config/DB");

const setupAdvisorTables = async () => {
    console.log("Setting up Advisor tables...\n");

    try {
        // Create advisor_assignments table
        console.log("Creating advisor_assignments table...");
        await pool.query(`
      CREATE TABLE IF NOT EXISTS advisor_assignments (
        assignment_id INT AUTO_INCREMENT PRIMARY KEY,
        user_entity_id INT NOT NULL,
        department VARCHAR(100) NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        assigned_by INT,
        UNIQUE KEY unique_advisor (user_entity_id),
        INDEX idx_department (department)
      )
    `);
        console.log("✓ advisor_assignments created");

        // Verify table exists
        const [tables] = await pool.query("SHOW TABLES LIKE 'advisor_assignments'");
        console.log(`\n✓ Advisor tables setup completed! (${tables.length} table created)`);

    } catch (error) {
        console.error("\n✗ Error setting up advisor tables:", error.message);
        process.exit(1);
    } finally {
        await pool.end();
        console.log("\nDatabase connection closed.");
    }
};

setupAdvisorTables();
