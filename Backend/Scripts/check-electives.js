require('dotenv').config();
const pool = require('../Db_config/DB');

async function checkElectives() {
    console.log('🔍 Checking Electives...\n');

    try {
        const [rows] = await pool.query(`
            SELECT 
                ce.entity_name,
                MAX(CASE WHEN ca.attribute_name = 'code' THEN cea.value_string END) as code,
                MAX(CASE WHEN ca.attribute_name = 'courseType' THEN cea.value_string END) as type,
                MAX(CASE WHEN ca.attribute_name = 'max_students' THEN cea.value_number END) as capacity
            FROM course_entity ce
            JOIN course_entity_attribute cea ON ce.entity_id = cea.entity_id
            JOIN course_attributes ca ON cea.attribute_id = ca.attribute_id
            GROUP BY ce.entity_id
            HAVING type = 'elective'
        `);

        console.log(`Found ${rows.length} electives:`);
        rows.forEach(r => {
            console.log(`   - [${r.code}] ${r.entity_name} (Cap: ${r.capacity})`);
        });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkElectives();
