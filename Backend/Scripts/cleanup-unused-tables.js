require('dotenv').config();
const pool = require('../Db_config/DB');

async function cleanupUnusedTables() {
  try {
    console.log('\n🧹 Cleaning up unused tables...\n');

    // Drop course_staff table (unused - admin uses assignment_entity instead)
    try {
      await pool.query('DROP TABLE course_staff');
      console.log('✅ Dropped unused table: course_staff');
    } catch (error) {
      if (error.code === 'ER_BAD_TABLE_ERROR') {
        console.log('⚠️  Table course_staff does not exist (already deleted)');
      } else {
        throw error;
      }
    }

    console.log('\n✅ Database cleanup complete!\n');
    console.log('📋 Remaining tables in use:');
    console.log('   • course_resources - Uploaded materials');
    console.log('   • course_schedule - Class schedules');
    console.log('   • assignment_entity - Staff assignments (from admin)');
    console.log('   • assignment_entity_attribute - Assignment roles');
    console.log('   • staff_entity - Staff records');
    console.log('   • staff_entity_attribute - Staff details\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupUnusedTables();
