require('dotenv').config();
const pool = require('./Db_config/DB');

async function testEndpoints() {
  try {
    console.log('\n🔍 Testing Course Endpoints...\n');

    // Test 1: Check course_staff table
    console.log('1. Checking course_staff table structure...');
    const [staffTableInfo] = await pool.query('DESCRIBE course_staff');
    console.log(`   ✓ Table has ${staffTableInfo.length} columns`);

    // Test 2: Check if there are any staff assignments
    console.log('\n2. Checking for existing staff assignments...');
    const [staffAssignments] = await pool.query('SELECT COUNT(*) as count FROM course_staff');
    console.log(`   ✓ Total assignments: ${staffAssignments[0].count}`);

    // Test 3: Check staff_entity table
    console.log('\n3. Checking staff_entity table...');
    const [staffEntities] = await pool.query('SELECT COUNT(*) as count FROM staff_entity');
    console.log(`   ✓ Total staff entities: ${staffEntities[0].count}`);

    // Test 4: Check staff_attributes
    console.log('\n4. Checking staff attributes...');
    const [staffAttrs] = await pool.query('SELECT attribute_name FROM staff_attributes LIMIT 10');
    console.log(`   ✓ Available attributes:`);
    staffAttrs.forEach(attr => console.log(`      - ${attr.attribute_name}`));

    // Test 5: Check course_schedule table
    console.log('\n5. Checking course_schedule table...');
    const [scheduleCount] = await pool.query('SELECT COUNT(*) as count FROM course_schedule');
    console.log(`   ✓ Total schedules: ${scheduleCount[0].count}`);

    console.log('\n✅ All checks completed!');
    console.log('\n📝 Summary:');
    console.log('   - course_staff table: READY');
    console.log('   - course_schedule table: READY');
    console.log('   - Staff EAV model: READY');
    console.log('\n💡 To test the full flow:');
    console.log('   1. Add staff assignments via admin panel');
    console.log('   2. Add course schedules via admin panel');
    console.log('   3. Test endpoints from Courses page');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testEndpoints();
