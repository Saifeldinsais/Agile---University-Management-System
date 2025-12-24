require('dotenv').config();
const pool = require('./Db_config/DB');

async function verify() {
  try {
    const [tables] = await pool.query('SHOW TABLES LIKE "course_%"');
    console.log('\n✅ Course-related tables created:');
    tables.forEach(t => {
      const tableName = Object.values(t)[0];
      console.log('   ✓', tableName);
    });
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verify();
