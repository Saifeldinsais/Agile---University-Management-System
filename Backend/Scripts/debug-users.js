require('dotenv').config();
const pool = require('../Db_config/DB');

async function checkAllUsers() {
    try {
        console.log('📋 All users in database:\n');

        const [users] = await pool.query(`
      SELECT 
        e.entity_id,
        e.entity_type,
        e.entity_name,
        ea_email.value_string as email
      FROM entities e
      LEFT JOIN entity_attribute ea_email ON e.entity_id = ea_email.entity_id
      LEFT JOIN attributes a_email ON ea_email.attribute_id = a_email.attribute_id AND a_email.attribute_name = 'email'
      WHERE e.entity_type IN ('admin', 'student', 'doctor')
      ORDER BY e.entity_type, e.entity_id
    `);

        if (users.length === 0) {
            console.log('   No users found in database\n');
        } else {
            users.forEach(user => {
                console.log(`   [${user.entity_type.toUpperCase()}] ${user.entity_name} (${user.email || 'no email'})`);
            });
            console.log(`\n   Total: ${users.length} users\n`);
        }

        // Check for @admin emails specifically
        const [adminEmails] = await pool.query(`
      SELECT 
        e.entity_id,
        e.entity_type,
        e.entity_name,
        ea.value_string as email
      FROM entities e
      JOIN entity_attribute ea ON e.entity_id = ea.entity_id
      JOIN attributes a ON ea.attribute_id = a.attribute_id
      WHERE a.attribute_name = 'email' AND ea.value_string LIKE '%@admin%'
    `);

        if (adminEmails.length > 0) {
            console.log('   Found users with @admin email:');
            adminEmails.forEach(admin => {
                console.log(`     - ${admin.email} (Type: ${admin.entity_type}, ID: ${admin.entity_id})`);
            });
            console.log('');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkAllUsers();
