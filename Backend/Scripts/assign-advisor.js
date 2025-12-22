require("dotenv").config();
const mysql = require("mysql2/promise");
const readline = require("readline");

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'JoeSameh568743^',
    database: 'university_management'
});


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

const assignAdvisor = async () => {
    console.log("\n--- Assign Advisor Role ---\n");

    try {
        const email = await askQuestion("Enter user email to make advisor: ");
        if (!email) {
            console.log("Email is required.");
            process.exit(1);
        }

        // 1. Find user ID
        // We need to look up the user entity ID using the 'email' attribute
        // EAV lookup
        const [userRows] = await pool.query(`
      SELECT e.entity_id, ea.value_string as email
      FROM entities e
      JOIN entity_attribute ea ON e.entity_id = ea.entity_id
      JOIN attributes a ON ea.attribute_id = a.attribute_id
      WHERE a.attribute_name = 'email' AND ea.value_string = ?
    `, [email]);

        if (userRows.length === 0) {
            console.log(`\n❌ User with email '${email}' not found.`);
            process.exit(1);
        }

        const userId = userRows[0].entity_id;
        console.log(`\n✓ Found User ID: ${userId}`);

        // 2. Ask for Department
        const department = await askQuestion("Enter department name (e.g. 'Computer Science'): ");
        if (!department) {
            console.log("Department is required.");
            process.exit(1);
        }

        // 3. Assign
        console.log(`\nAssigning user ${userId} to department '${department}'...`);

        // Check existing
        const [existing] = await pool.query("SELECT * FROM advisor_assignments WHERE user_entity_id = ?", [userId]);

        if (existing.length > 0) {
            const confirm = await askQuestion(`User is already advisor for '${existing[0].department}'. Overwrite? (y/n): `);
            if (confirm.toLowerCase() !== 'y') {
                console.log("Operation cancelled.");
                process.exit(0);
            }

            await pool.query("UPDATE advisor_assignments SET department = ? WHERE user_entity_id = ?", [department, userId]);
            console.log("✓ Updated existing advisor assignment.");
        } else {
            await pool.query("INSERT INTO advisor_assignments (user_entity_id, department) VALUES (?, ?)", [userId, department]);
            console.log("✓ Created new advisor assignment.");
        }

        console.log("\nDone! You can now login with this user and access /advisor/dashboard");

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        pool.end();
        rl.close();
    }
};

assignAdvisor();
