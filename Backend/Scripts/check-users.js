const pool = require('../Db_config/DB');

async function checkRecentUsers() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        e.entity_id,
        e.entity_type,
        e.entity_name,
        ea.value_string as email
      FROM entities e
      JOIN entity_attribute ea ON e.entity_id = ea.entity_id
      JOIN attributes a ON ea.attribute_id = a.attribute_id
      WHERE a.attribute_name = 'email'
      ORDER BY e.entity_id DESC
      LIMIT 5
    `);

    console.log('\n✅ Recent Users in Database:');
    console.table(rows);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkRecentUsers();
