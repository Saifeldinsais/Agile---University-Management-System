require('dotenv').config();
const pool = require('../Db_config/DB');

async function checkEnum() {
    try {
        const [rows] = await pool.query('SHOW COLUMNS FROM classroom_attributes LIKE "data_type"');
        console.log('data_type ENUM:', rows[0].Type);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkEnum();
