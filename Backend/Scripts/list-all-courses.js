require('dotenv').config();
const pool = require('../Db_config/DB');

async function listAllCourses() {
    try {
        console.log('📚 All courses in course_entity:\n');

        const [courses] = await pool.query(`
      SELECT
        ce.entity_id AS id,
        ce.entity_name,
        ce.created_at,
        MAX(CASE WHEN ca.attribute_name='title' THEN cea.value_string END) AS title,
        MAX(CASE WHEN ca.attribute_name='code' THEN cea.value_string END) AS code,
        MAX(CASE WHEN ca.attribute_name='credits' THEN cea.value_number END) AS credits,
        MAX(CASE WHEN ca.attribute_name='department' THEN cea.value_string END) AS department
      FROM course_entity ce
      LEFT JOIN course_entity_attribute cea ON ce.entity_id = cea.entity_id
      LEFT JOIN course_attributes ca ON cea.attribute_id = ca.attribute_id
      GROUP BY ce.entity_id
      ORDER BY ce.created_at DESC;
    `);

        console.log(`Total: ${courses.length} courses\n`);

        courses.forEach((c, i) => {
            console.log(`${i + 1}. ${c.code || 'NO CODE'} - ${c.title || c.entity_name}`);
            console.log(`   ID: ${c.id}, Credits: ${c.credits || 'N/A'}, Dept: ${c.department || 'N/A'}`);
            console.log(`   Created: ${c.created_at}\n`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

listAllCourses();
