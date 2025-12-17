require('dotenv').config();
const pool = require('../Db_config/DB');

async function testViewCourses() {
    try {
        console.log('🧪 Testing viewCourses query...\n');

        // This is the exact query used in student.controller.js viewCourses
        const [rows] = await pool.query(`
      SELECT
        ce.entity_id AS id,
        ce.entity_id AS _id,
        MAX(CASE WHEN ca.attribute_name='title' THEN cea.value_string END) AS title,
        MAX(CASE WHEN ca.attribute_name='code' THEN cea.value_string END) AS code,
        MAX(CASE WHEN ca.attribute_name='description' THEN cea.value_string END) AS description,
        MAX(CASE WHEN ca.attribute_name='credits' THEN cea.value_number END) AS credits,
        MAX(CASE WHEN ca.attribute_name='department' THEN cea.value_string END) AS department
      FROM course_entity ce
      LEFT JOIN course_entity_attribute cea ON ce.entity_id = cea.entity_id
      LEFT JOIN course_attributes ca ON cea.attribute_id = ca.attribute_id
      GROUP BY ce.entity_id
      ORDER BY ce.entity_id DESC;
    `);

        console.log(`✅ Found ${rows.length} courses\n`);

        if (rows.length > 0) {
            console.log('📚 Courses that will be displayed:\n');
            rows.forEach(course => {
                console.log(`   ${course.code} - ${course.title}`);
                console.log(`      Credits: ${course.credits}, Department: ${course.department}`);
                console.log(`      ID: ${course.id}\n`);
            });
        } else {
            console.log('❌ No courses found!');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

testViewCourses();
