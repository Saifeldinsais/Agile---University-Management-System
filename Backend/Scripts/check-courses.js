require('dotenv').config();
const pool = require('../Db_config/DB');

async function checkCourses() {
    try {
        console.log('📚 Checking courses in database...\n');

        // Check course_entity table
        const [courses] = await pool.query('SELECT * FROM course_entity');
        console.log(`Course Entity Count: ${courses.length}`);

        if (courses.length > 0) {
            console.log('\n✅ Courses found in course_entity:');
            courses.forEach(c => {
                console.log(`   - ID: ${c.entity_id}, Name: ${c.entity_name}`);
            });
        } else {
            console.log('\n❌ NO courses found in course_entity table!');
        }

        // Check the old entities table for comparison
        const [oldCourses] = await pool.query(`
      SELECT * FROM entities WHERE entity_type = 'course'
    `);
        console.log(`\n📋 Courses in old 'entities' table: ${oldCourses.length}`);

        if (oldCourses.length > 0) {
            console.log('\n⚠️  Found courses in OLD table:');
            oldCourses.forEach(c => {
                console.log(`   - ID: ${c.entity_id}, Name: ${c.entity_name}`);
            });
            console.log('\n💡 TIP: You need to migrate these to course_entity table!');
        }

        // Check course attributes
        const [attrs] = await pool.query('SELECT * FROM course_attributes');
        console.log(`\n📌 Course attributes available: ${attrs.length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkCourses();
