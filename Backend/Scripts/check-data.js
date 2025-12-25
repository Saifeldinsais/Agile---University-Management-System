require('dotenv').config();
const pool = require('../Db_config/DB');
const fs = require('fs');

async function checkData() {
    try {
        let output = '';

        // Check entity ID 37
        output += '\n=== Entity ID 37 ===\n';
        const [e37] = await pool.query(`SELECT * FROM entities WHERE entity_id = 37`);
        output += JSON.stringify(e37, null, 2) + '\n';

        // Check staff_entity table 
        output += '\n=== staff_entity table (first 10) ===\n';
        const [staffE] = await pool.query(`SELECT * FROM staff_entity LIMIT 10`);
        output += JSON.stringify(staffE, null, 2) + '\n';

        // Check what getAvailableStaff would return
        output += '\n=== Doctors in entities table ===\n';
        const [doctors] = await pool.query(`
            SELECT entity_id, entity_type, entity_name 
            FROM entities 
            WHERE entity_type = 'doctor'
        `);
        output += JSON.stringify(doctors, null, 2) + '\n';

        fs.writeFileSync('./debug-output.txt', output);
        console.log('Output written to debug-output.txt');
        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

checkData();
