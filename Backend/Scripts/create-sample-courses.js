require('dotenv').config();
const pool = require('../Db_config/DB');

async function createSampleCourses() {
    try {
        console.log('📚 Creating Sample Courses...\n');

        // Sample courses data
        const courses = [
            {
                code: 'CSE101',
                name: 'Introduction to Computer Science',
                description: 'Fundamentals of computer science and programming',
                credits: 3,
                department: 'Computer Science'
            },
            {
                code: 'CSE233',
                name: 'Agile Software Engineering',
                description: 'Modern software development methodologies and practices',
                credits: 3,
                department: 'Computer Science'
            },
            {
                code: 'MATH201',
                name: 'Calculus II',
                description: 'Advanced calculus and mathematical analysis',
                credits: 4,
                department: 'Mathematics'
            },
            {
                code: 'PHY101',
                name: 'Physics I',
                description: 'Introduction to mechanics and thermodynamics',
                credits: 3,
                department: 'Physics'
            },
            {
                code: 'ENG102',
                name: 'English Composition',
                description: 'Academic writing and communication skills',
                credits: 2,
                department: 'English'
            }
        ];

        // Get attribute IDs for courses
        const [attributes] = await pool.query(`
      SELECT attribute_id, attribute_name FROM attributes 
      WHERE attribute_name IN ('course_code', 'course_name', 'description', 'credits', 'department')
    `);

        const attrMap = {};
        attributes.forEach(attr => {
            attrMap[attr.attribute_name] = attr.attribute_id;
        });

        console.log('✅ Found course attributes:', Object.keys(attrMap).join(', '));

        // Create courses
        for (const course of courses) {
            // Check if course already exists
            const [existing] = await pool.query(`
        SELECT e.entity_id FROM entities e
        JOIN entity_attribute ea ON e.entity_id = ea.entity_id
        JOIN attributes a ON ea.attribute_id = a.attribute_id
        WHERE e.entity_type = 'course' AND a.attribute_name = 'course_code' AND ea.value_string = ?
      `, [course.code]);

            if (existing.length > 0) {
                console.log(`⏭️  ${course.code} already exists, skipping...`);
                continue;
            }

            // Create course entity
            const [result] = await pool.query(
                'INSERT INTO entities (entity_type, entity_name) VALUES (?, ?)',
                ['course', course.name]
            );
            const courseId = result.insertId;

            // Insert course attributes
            await pool.query(
                'INSERT INTO entity_attribute (entity_id, attribute_id, value_string) VALUES (?, ?, ?)',
                [courseId, attrMap.course_code, course.code]
            );

            await pool.query(
                'INSERT INTO entity_attribute (entity_id, attribute_id, value_string) VALUES (?, ?, ?)',
                [courseId, attrMap.course_name, course.name]
            );

            await pool.query(
                'INSERT INTO entity_attribute (entity_id, attribute_id, value_string) VALUES (?, ?, ?)',
                [courseId, attrMap.description, course.description]
            );

            await pool.query(
                'INSERT INTO entity_attribute (entity_id, attribute_id, value_number) VALUES (?, ?, ?)',
                [courseId, attrMap.credits, course.credits]
            );

            await pool.query(
                'INSERT INTO entity_attribute (entity_id, attribute_id, value_string) VALUES (?, ?, ?)',
                [courseId, attrMap.department, course.department]
            );

            console.log(`✅ Created: ${course.code} - ${course.name}`);
        }

        console.log(`\n🎉 Created ${courses.length} sample courses!`);
        console.log('\n📋 Summary:');
        const [allCourses] = await pool.query(`
      SELECT 
        e.entity_id,
        e.entity_name,
        (SELECT value_string FROM entity_attribute ea 
         JOIN attributes a ON ea.attribute_id = a.attribute_id 
         WHERE ea.entity_id = e.entity_id AND a.attribute_name = 'course_code') as code
      FROM entities e
      WHERE e.entity_type = 'course'
    `);

        allCourses.forEach(c => {
            console.log(`   - ${c.code}: ${c.entity_name}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

createSampleCourses();
