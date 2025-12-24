require('dotenv').config();
const pool = require('./Db_config/DB');

async function debugCourseStaff() {
  try {
    console.log('\n📋 Checking course_staff table...\n');
    
    const [allAssignments] = await pool.query(`
      SELECT * FROM course_staff
    `);
    
    console.log(`Total assignments in course_staff: ${allAssignments.length}\n`);
    
    if (allAssignments.length > 0) {
      console.log('All assignments:');
      console.log(JSON.stringify(allAssignments, null, 2));
    }
    
    // Also check for any other tables that might store course assignments
    console.log('\n\n📊 Checking if there are other assignment-related tables...\n');
    
    const [tables] = await pool.query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'university_management' 
      AND TABLE_NAME LIKE '%course%' OR TABLE_NAME LIKE '%assign%'
    `);
    
    console.log('Tables containing "course" or "assign":');
    tables.forEach(t => console.log('-', t.TABLE_NAME));
    
    // Check admin enrollments table
    const [enrollments] = await pool.query(`SELECT * FROM enrollments LIMIT 5`);
    console.log(`\nenrollments table sample (${enrollments.length} total):`);
    console.log(JSON.stringify(enrollments, null, 2));
    
    // Check if there's a course staff view or different structure
    const [courseEA] = await pool.query(`
      SELECT * FROM course_entity_attribute WHERE attribute_id IN (
        SELECT attribute_id FROM course_attributes WHERE attribute_name LIKE '%staff%' OR attribute_name LIKE '%ta%' OR attribute_name LIKE '%assign%'
      ) LIMIT 5
    `);
    
    if (courseEA.length > 0) {
      console.log('\nCourse staff attributes found in EAV:');
      console.log(JSON.stringify(courseEA, null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

debugCourseStaff();
