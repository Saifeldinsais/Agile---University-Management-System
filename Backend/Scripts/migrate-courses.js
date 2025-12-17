require('dotenv').config();
const pool = require('../Db_config/DB');

async function migrateCourses() {
    try {
        console.log('🔄 Migrating courses from entities to course_entity...\n');

        // Get all courses from old entities table
        const [oldCourses] = await pool.query(`
      SELECT e.entity_id, e.entity_name, e.created_at
      FROM entities e
      WHERE e.entity_type = 'course'
    `);

        console.log(`📊 Found ${oldCourses.length} courses in old 'entities' table\n`);

        if (oldCourses.length === 0) {
            console.log('❌ No courses to migrate!');
            process.exit(0);
        }

        for (const oldCourse of oldCourses) {
            console.log(`\n📚 Migrating: ${oldCourse.entity_name} (ID: ${oldCourse.entity_id})`);

            // Get all attributes for this course from old table  
            const [attributes] = await pool.query(`
        SELECT 
          a.attribute_name,
          ea.value_string,
          ea.value_number
        FROM entity_attribute ea
        JOIN attributes a ON ea.attribute_id = a.attribute_id
        WHERE ea.entity_id = ?
      `, [oldCourse.entity_id]);

            // Extract course data
            let courseData = {
                code: null,
                title: oldCourse.entity_name,
                description: '',
                credits: null,
                department: null
            };

            attributes.forEach(attr => {
                const value = attr.value_string || attr.value_number;

                if (attr.attribute_name === 'course_code') courseData.code = value;
                if (attr.attribute_name === 'course_name') courseData.title = value;
                if (attr.attribute_name === 'description') courseData.description = value;
                if (attr.attribute_name === 'credits') courseData.credits = value;
                if (attr.attribute_name === 'department') courseData.department = value;
            });

            // If no code, skip
            if (!courseData.code) {
                console.log(`  ⚠️  No course code found, skipping...`);
                continue;
            }

            // Check if already migrated by code
            const [existing] = await pool.query(`
        SELECT ce.entity_id 
        FROM course_entity ce
        JOIN course_entity_attribute cea ON ce.entity_id = cea.entity_id
        JOIN course_attributes ca ON cea.attribute_id = ca.attribute_id
        WHERE ca.attribute_name = 'code' AND cea.value_string = ?
      `, [courseData.code]);

            if (existing.length > 0) {
                console.log(`  ⏭️  Already exists with code '${courseData.code}', skipping...`);
                continue;
            }

            // Create course in new table
            const [result] = await pool.query(
                'INSERT INTO course_entity (entity_type, entity_name, created_at) VALUES (?, ?, ?)',
                ['course', courseData.title, oldCourse.created_at]
            );
            const newCourseId = result.insertId;
            console.log(`  ✅ Created course_entity (new ID: ${newCourseId})`);

            // Get attribute IDs
            const [codeAttr] = await pool.query('SELECT attribute_id FROM course_attributes WHERE attribute_name = ?', ['code']);
            const [titleAttr] = await pool.query('SELECT attribute_id FROM course_attributes WHERE attribute_name = ?', ['title']);
            const [descAttr] = await pool.query('SELECT attribute_id FROM course_attributes WHERE attribute_name = ?', ['description']);
            const [creditsAttr] = await pool.query('SELECT attribute_id FROM course_attributes WHERE attribute_name = ?', ['credits']);
            const [deptAttr] = await pool.query('SELECT attribute_id FROM course_attributes WHERE attribute_name = ?', ['department']);

            // Insert attributes
            if (courseData.code && codeAttr.length > 0) {
                await pool.query(
                    'INSERT INTO course_entity_attribute (entity_id, attribute_id, value_string) VALUES (?, ?, ?)',
                    [newCourseId, codeAttr[0].attribute_id, courseData.code]
                );
                console.log(`  ✅ Added code: ${courseData.code}`);
            }

            if (titleAttr.length > 0) {
                await pool.query(
                    'INSERT INTO course_entity_attribute (entity_id, attribute_id, value_string) VALUES (?, ?, ?)',
                    [newCourseId, titleAttr[0].attribute_id, courseData.title]
                );
                console.log(`  ✅ Added title: ${courseData.title}`);
            }

            if (courseData.description && descAttr.length > 0) {
                await pool.query(
                    'INSERT INTO course_entity_attribute (entity_id, attribute_id, value_string) VALUES (?, ?, ?)',
                    [newCourseId, descAttr[0].attribute_id, courseData.description]
                );
                console.log(`  ✅ Added description`);
            }

            if (courseData.credits && creditsAttr.length > 0) {
                await pool.query(
                    'INSERT INTO course_entity_attribute (entity_id, attribute_id, value_number) VALUES (?, ?, ?)',
                    [newCourseId, creditsAttr[0].attribute_id, courseData.credits]
                );
                console.log(`  ✅ Added credits: ${courseData.credits}`);
            }

            if (courseData.department && deptAttr.length > 0) {
                await pool.query(
                    'INSERT INTO course_entity_attribute (entity_id, attribute_id, value_string) VALUES (?, ?, ?)',
                    [newCourseId, deptAttr[0].attribute_id, courseData.department]
                );
                console.log(`  ✅ Added department: ${courseData.department}`);
            }
        }

        console.log(`\n🎉 Migration complete!`);

        // Verify
        const [newCount] = await pool.query('SELECT COUNT(*) as count FROM course_entity');
        console.log(`\n📊 Total courses in course_entity: ${newCount[0].count}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

migrateCourses();
