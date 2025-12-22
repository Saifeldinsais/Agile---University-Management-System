require('dotenv').config();
const pool = require('../Db_config/DB');

const electivesToKeep = ['CSE355'];
const electivesToRemove = ['ASU311', 'ASUx12', 'CSE233', 'CSE322', 'CSE361', 'EPM119'];

async function updateElectives() {
    console.log('🔧 Updating Elective Status...\n');

    try {
        // Get attribute IDs
        const [attrRows] = await pool.query(
            "SELECT attribute_id, attribute_name FROM course_attributes WHERE attribute_name IN ('courseType', 'code')"
        );
        
        const attrMap = {};
        attrRows.forEach(r => attrMap[r.attribute_name] = r.attribute_id);

        // Helper to update course type
        const updateType = async (code, type) => {
            // Find course
            const [courseRows] = await pool.query(`
                SELECT ce.entity_id 
                FROM course_entity ce
                JOIN course_entity_attribute cea ON ce.entity_id = cea.entity_id
                WHERE cea.attribute_id = ? AND cea.value_string = ?
            `, [attrMap.code, code]);

            if (courseRows.length === 0) {
                console.log(`   ⚠️  Course not found: ${code}`);
                return;
            }

            const courseId = courseRows[0].entity_id;

            // Check if courseType attribute exists for this course
            const [existing] = await pool.query(
                'SELECT value_id FROM course_entity_attribute WHERE entity_id = ? AND attribute_id = ?',
                [courseId, attrMap.courseType]
            );

            if (existing.length > 0) {
                await pool.query(
                    'UPDATE course_entity_attribute SET value_string = ? WHERE value_id = ?',
                    [type, existing[0].value_id]
                );
            } else {
                await pool.query(
                    'INSERT INTO course_entity_attribute (entity_id, attribute_id, value_string) VALUES (?, ?, ?)',
                    [courseId, attrMap.courseType, type]
                );
            }
            console.log(`   ✅ Updated ${code} to '${type}'`);
        };

        // 1. Set CSE355 to elective
        for (const code of electivesToKeep) {
            await updateType(code, 'elective');
        }

        // 2. Set others to core
        for (const code of electivesToRemove) {
            await updateType(code, 'core');
        }

        console.log('\n✨ Electives update complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

updateElectives();
