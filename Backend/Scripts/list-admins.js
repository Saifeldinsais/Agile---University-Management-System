require('dotenv').config();
const pool = require('../Db_config/DB');

async function listAdmins() {
    try {
        console.log('📋 Checking for admin accounts...\n');

        const [admins] = await pool.query(`
      SELECT 
        e.entity_id,
        e.entity_type,
        e.entity_name,
        e.created_at,
        GROUP_CONCAT(CONCAT(a.attribute_name, ':', ea.value_string) SEPARATOR ', ') as attributes
      FROM entities e
      LEFT JOIN entity_attribute ea ON e.entity_id = ea.entity_id
      LEFT JOIN attributes a ON ea.attribute_id = a.attribute_id
      WHERE e.entity_type = 'admin'
      GROUP BY e.entity_id
    `);

        if (admins.length === 0) {
            console.log('❌ No admin accounts found.');
            console.log('   Run "node create-admin.js" to create one.\n');
        } else {
            console.log(`✅ Found ${admins.length} admin account(s):\n`);
            admins.forEach((admin, index) => {
                console.log(`   Admin #${index + 1}:`);
                console.log(`     ID: ${admin.entity_id}`);
                console.log(`     Name: ${admin.entity_name}`);
                console.log(`     Created: ${admin.created_at}`);
                console.log(`     Details: ${admin.attributes}`);
                console.log('');
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

listAdmins();
