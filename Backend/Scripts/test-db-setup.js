require('dotenv').config();
const pool = require('./Db_config/DB');

async function testDatabaseSetup() {
  try {
    console.log('\n🔍 Testing Course Resources Setup...\n');

    // Check if tables exist
    const [tables] = await pool.query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'university_management' 
      AND TABLE_NAME IN ('course_resources', 'course_staff', 'course_schedule')
    `);

    if (tables.length === 0) {
      console.error('❌ Tables not found! Run: node run-course-migration.js');
      process.exit(1);
    }

    console.log('✅ All required tables exist:');
    tables.forEach(t => console.log(`   ✓ ${t.TABLE_NAME}`));

    // Check table structure
    const [resourcesColumns] = await pool.query('DESCRIBE course_resources');
    console.log('\n📊 course_resources columns:');
    resourcesColumns.forEach(col => {
      console.log(`   ✓ ${col.Field} (${col.Type})`);
    });

    console.log('\n✅ Database setup is correct!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start the backend: npm start');
    console.log('   2. Start the frontend: npm run dev');
    console.log('   3. Try uploading a PDF from the Courses page');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testDatabaseSetup();
