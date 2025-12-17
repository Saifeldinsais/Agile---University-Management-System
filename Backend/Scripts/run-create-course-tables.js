require('dotenv').config();
const pool = require('../Db_config/DB');
const fs = require('fs');
const path = require('path');

async function createCourseTables() {
    try {
        console.log('📚 Creating Course EAV Tables...\n');

        const sqlFile = path.join(__dirname, 'create-course-tables.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        // Split by semicolons and execute each statement
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            try {
                const [result] = await pool.query(statement);

                // If it's a SELECT statement, display the results
                if (statement.toUpperCase().startsWith('SELECT')) {
                    if (Array.isArray(result) && result.length > 0) {
                        console.log(result[0]);
                    }
                } else if (statement.toUpperCase().includes('CREATE TABLE')) {
                    const tableName = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?`?(\w+)`?/i)?.[1];
                    console.log(`✅ Created table: ${tableName}`);
                } else if (statement.toUpperCase().includes('INSERT INTO')) {
                    console.log(`✅ Inserted default attributes`);
                }
            } catch (err) {
                if (err.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log('ℹ️  Tables already exist, skipping...');
                } else {
                    console.error('⚠️  Statement error:', err.message);
                }
            }
        }

        console.log('\n🎉 Course tables setup complete!');
        console.log('\n📋 Table Structure:');
        console.log('   - course_entity: Stores course entities');
        console.log('   - course_attributes: Defines course attributes');
        console.log('   - course_entity_attribute: Stores attribute values\n');

        // Show current attributes
        const [attributes] = await pool.query('SELECT * FROM course_attributes');
        console.log(`✅ Course attributes available: ${attributes.length}`);
        attributes.forEach(attr => {
            console.log(`   - ${attr.attribute_name} (${attr.data_type})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

createCourseTables();
