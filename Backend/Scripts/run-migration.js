require('dotenv').config();
const pool = require('../Db_config/DB');
const fs = require('fs');

async function runMigration() {
    try {
        console.log('🔄 Running database migration...\n');

        const migration = fs.readFileSync('./migration_fix_schema.sql', 'utf8');
        const statements = migration
            .split(';')
            .map(s => s.trim())
            .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'));

        for (const statement of statements) {
            if (statement.toLowerCase().includes('select')) {
                const [rows] = await pool.query(statement);
                console.log(rows[0]);
            } else {
                await pool.query(statement);
                console.log('✅', statement.substring(0, 50) + '...');
            }
        }

        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
