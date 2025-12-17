require('dotenv').config();
const pool = require('../Db_config/DB');

async function checkEnrollmentAttrs() {
    try {
        const [rows] = await pool.query('SELECT * FROM enrollment_attributes ORDER BY attribute_name');
        console.log('\n📋 Enrollment Attributes:\n');
        rows.forEach(r => {
            console.log(`   - ${r.attribute_name.padEnd(20)} : ${r.data_type}`);
        });
        console.log(`\n Total: ${rows.length} attributes\n`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkEnrollmentAttrs();
