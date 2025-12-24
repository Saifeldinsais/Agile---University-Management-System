require('dotenv').config();
const pool = require('./Db_config/DB');

async function checkTables() {
  try {
    const [tables] = await pool.query('SHOW TABLES');
    console.log('Tables in database:');
    tables.forEach(t => console.log('-', Object.values(t)[0]));
    
    // Check if staff_entity exists
    const [staffEntities] = await pool.query('SELECT COUNT(*) as count FROM staff_entity');
    console.log('\nStaff entities:', staffEntities[0].count);
    
    // Check if course_entity exists
    const [courseEntities] = await pool.query('SELECT COUNT(*) as count FROM course_entity');
    console.log('Course entities:', courseEntities[0].count);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTables();
