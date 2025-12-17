require('dotenv').config();
const pool = require('../Db_config/DB');

async function checkSchema() {
    try {
        console.log('📋 Checking entity_attribute table schema:\n');

        const [columns] = await pool.query(`
      SHOW COLUMNS FROM entity_attribute
    `);

        console.table(columns);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkSchema();
