require('dotenv').config();
const pool = require('../Db_config/DB');

const electives = [
    'CSE355'
];

async function fixElectives() {
    console.log('🔧 Setting up Elective Courses...\n');

    try {
        // 1. Ensure attributes exist
        const attributes = [
            { name: 'courseType', type: 'string' },
            { name: 'max_students', type: 'int' },
            { name: 'enrolled_count', type: 'int' }
        ];

        for (const attr of attributes) {
            const [existing] = await pool.query(
                'SELECT attribute_id FROM course_attributes WHERE attribute_name = ?',
                [attr.name]
            );
            
            if (existing.length === 0) {
                await pool.query(
                    'INSERT INTO course_attributes (attribute_name, data_type) VALUES (?, ?)',
                    [attr.name, attr.type]
                );
                console.log(`   ✅ Created attribute: ${attr.name}`);
            }
        }

        // Get attribute IDs
        const [attrRows] = await pool.query(
            "SELECT attribute_id, attribute_name FROM course_attributes WHERE attribute_name IN ('courseType', 'max_students', 'enrolled_count', 'code')"
        );
        
        const attrMap = {};
        attrRows.forEach(r => attrMap[r.attribute_name] = r.attribute_id);

        // 2. Update courses
        for (const code of electives) {
            // Find course by code
            const [courseRows] = await pool.query(`
                SELECT ce.entity_id 
                FROM course_entity ce
                JOIN course_entity_attribute cea ON ce.entity_id = cea.entity_id
                WHERE cea.attribute_id = ? AND cea.value_string = ?
            `, [attrMap.code, code]);

            if (courseRows.length === 0) {
                console.log(`   ⚠️  Course not found: ${code}`);
                continue;
            }

            const courseId = courseRows[0].entity_id;
            console.log(`   Processing ${code} (ID: ${courseId})...`);

            // Helper to upsert value
            const upsertValue = async (attrName, value, isNumber = false) => {
                const attrId = attrMap[attrName];
                const [existing] = await pool.query(
                    'SELECT value_id FROM course_entity_attribute WHERE entity_id = ? AND attribute_id = ?',
                    [courseId, attrId]
                );

                if (existing.length > 0) {
                    await pool.query(
                        `UPDATE course_entity_attribute SET ${isNumber ? 'value_number' : 'value_string'} = ? WHERE value_id = ?`,
                        [value, existing[0].value_id]
                    );
                } else {
                    await pool.query(
                        `INSERT INTO course_entity_attribute (entity_id, attribute_id, ${isNumber ? 'value_number' : 'value_string'}) VALUES (?, ?, ?)`,
                        [courseId, attrId, value]
                    );
                }
            };

            // Set as elective
            await upsertValue('courseType', 'elective');
            // Set capacity
            await upsertValue('max_students', 50, true);
            // Set enrolled count (default 0 if not exists)
            // We don't want to reset it if people are already enrolled, but for now it's likely 0
            const [enrolled] = await pool.query(
                'SELECT value_id FROM course_entity_attribute WHERE entity_id = ? AND attribute_id = ?',
                [courseId, attrMap.enrolled_count]
            );
            if (enrolled.length === 0) {
                await upsertValue('enrolled_count', 0, true);
            }

            console.log(`      ✅ Marked as elective`);
        }

        console.log('\n✨ Electives setup complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixElectives();
