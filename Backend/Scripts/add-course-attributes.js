require('dotenv').config();
const pool = require('../Db_config/DB');

async function addMissingCourseAttributes() {
    try {
        console.log('🔧 Adding missing course attributes...\n');

        // The admin.service.js expects these attribute names
        const requiredAttributes = [
            { name: 'code', type: 'string' },
            { name: 'title', type: 'string' },
            { name: 'description', type: 'string' },
            { name: 'credits', type: 'int' },
            { name: 'department', type: 'string' }
        ];

        for (const attr of requiredAttributes) {
            // Check if exists
            const [existing] = await pool.query(
                'SELECT * FROM course_attributes WHERE attribute_name = ?',
                [attr.name]
            );

            if (existing.length === 0) {
                await pool.query(
                    'INSERT INTO course_attributes (attribute_name, data_type) VALUES (?, ?)',
                    [attr.name, attr.type]
                );
                console.log(`✅ Added: ${attr.name} (${attr.type})`);
            } else {
                console.log(`⏭️  Already exists: ${attr.name}`);
            }
        }

        console.log('\n✅ All required course attributes are now available!');

        // Show all attributes
        const [all] = await pool.query('SELECT * FROM course_attributes ORDER BY attribute_name');
        console.log(`\n📋 Total course attributes: ${all.length}`);
        all.forEach(attr => {
            console.log(`   - ${attr.attribute_name} (${attr.data_type})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

addMissingCourseAttributes();
