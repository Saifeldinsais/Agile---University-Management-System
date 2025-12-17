require('dotenv').config();
const pool = require('../Db_config/DB');

async function checkAndFixSchema() {
    try {
        console.log('📋 Current schema:');
        const [columns] = await pool.query('SHOW COLUMNS FROM entity_attribute');
        columns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type})`);
        });

        console.log('\n🔧 Running ALTER TABLE commands...\n');

        // Drop old columns if they exist
        try {
            await pool.query('ALTER TABLE entity_attribute DROP COLUMN value_int');
            console.log('✅ Dropped value_int');
        } catch (e) { console.log('⏭️  value_int already dropped or doesn\'t exist'); }

        try {
            await pool.query('ALTER TABLE entity_attribute DROP COLUMN value_float');
            console.log('✅ Dropped value_float');
        } catch (e) { console.log('⏭️  value_float already dropped or doesn\'t exist'); }

        try {
            await pool.query('ALTER TABLE entity_attribute DROP COLUMN value_datetime');
            console.log('✅ Dropped value_datetime');
        } catch (e) { console.log('⏭️  value_datetime already dropped or doesn\'t exist'); }

        try {
            await pool.query('ALTER TABLE entity_attribute DROP COLUMN value_text');
            console.log('✅ Dropped value_text');
        } catch (e) { console.log('⏭️  value_text already dropped or doesn\'t exist'); }

        try {
            await pool.query('ALTER TABLE entity_attribute DROP COLUMN value_boolean');
            console.log('✅ Dropped value_boolean');
        } catch (e) { console.log('⏭️  value_boolean already dropped or doesn\'t exist'); }

        try {
            await pool.query('ALTER TABLE entity_attribute DROP COLUMN ea_id');
            console.log('✅ Dropped ea_id');
        } catch (e) { console.log('⏭️  ea_id already dropped or doesn\'t exist'); }

        // Add new columns if they don't exist
        try {
            await pool.query('ALTER TABLE entity_attribute ADD COLUMN value_id INT AUTO_INCREMENT PRIMARY KEY FIRST');
            console.log('✅ Added value_id');
        } catch (e) { console.log('⏭️  value_id already exists'); }

        try {
            await pool.query('ALTER TABLE entity_attribute ADD COLUMN value_number DECIMAL(20, 4)');
            console.log('✅ Added value_number');
        } catch (e) { console.log('⏭️  value_number already exists'); }

        try {
            await pool.query('ALTER TABLE entity_attribute ADD COLUMN value_reference INT');
            console.log('✅ Added value_reference');
        } catch (e) { console.log('⏭️  value_reference already exists'); }

        try {
            await pool.query('ALTER TABLE entity_attribute ADD COLUMN array_index INT');
            console.log('✅ Added array_index');
        } catch (e) { console.log('⏭️  array_index already exists'); }

        console.log('\n📋 Updated schema:');
        const [newColumns] = await pool.query('SHOW COLUMNS FROM entity_attribute');
        newColumns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type})`);
        });

        console.log('\n✅ Schema migration complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkAndFixSchema();
