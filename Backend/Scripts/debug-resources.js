require('dotenv').config();
const pool = require('../Db_config/DB');

async function debugResources() {
  try {
    console.log('=== DEBUGGING COURSE RESOURCES ===\n');

    // Check all courses
    console.log('📚 All courses in course_entity:');
    const [courses] = await pool.query(`
      SELECT entity_id, entity_name FROM course_entity ORDER BY entity_id
    `);
    console.log(courses);

    // Check course_resources table
    console.log('\n📄 All resources in course_resources:');
    const [resources] = await pool.query(`
      SELECT resource_id, course_id, title, file_name FROM course_resources ORDER BY resource_id
    `);
    console.log(resources);

    // Check for orphaned resources (course_id not in course_entity)
    console.log('\n⚠️ Orphaned resources (course_id not in course_entity):');
    const [orphaned] = await pool.query(`
      SELECT cr.resource_id, cr.course_id, cr.title
      FROM course_resources cr
      LEFT JOIN course_entity ce ON cr.course_id = ce.entity_id
      WHERE ce.entity_id IS NULL
    `);
    console.log(orphaned);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debugResources();
