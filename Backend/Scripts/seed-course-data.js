require('dotenv').config();
const pool = require('./Db_config/DB');

async function seedTestData() {
  try {
    console.log('\n🌱 Seeding test data for course staff...\n');

    // First, get some staff and courses to work with
    const [staffMembers] = await pool.query(
      'SELECT DISTINCT entity_id FROM staff_entity LIMIT 3'
    );

    const [courses] = await pool.query(
      'SELECT DISTINCT entity_id FROM course_entity LIMIT 2'
    );

    if (staffMembers.length === 0) {
      console.error('❌ No staff members found in database');
      console.log('   You need to create staff members first in Admin → Staff Directory');
      process.exit(1);
    }

    if (courses.length === 0) {
      console.error('❌ No courses found in database');
      console.log('   You need to create courses first in Admin → Curriculum');
      process.exit(1);
    }

    console.log(`Found ${staffMembers.length} staff members and ${courses.length} courses\n`);

    // Get a doctor ID (use staff entity ID 1 as the course creator/doctor)
    const doctorId = 1;

    // Assign staff to courses
    let assignmentCount = 0;
    for (let i = 0; i < Math.min(staffMembers.length, courses.length); i++) {
      const staffId = staffMembers[i].entity_id;
      const courseId = courses[i].entity_id;

      try {
        // Check if assignment already exists
        const [existing] = await pool.query(
          'SELECT assignment_id FROM course_staff WHERE course_id = ? AND staff_id = ?',
          [courseId, staffId]
        );

        if (existing.length === 0) {
          // Insert new assignment
          await pool.query(
            `INSERT INTO course_staff (course_id, staff_id, doctor_id, role, is_active)
             VALUES (?, ?, ?, 'Teaching Assistant', TRUE)`,
            [courseId, staffId, doctorId]
          );
          assignmentCount++;
          console.log(`✓ Assigned staff ${staffId} to course ${courseId}`);
        } else {
          console.log(`⚠ Staff ${staffId} already assigned to course ${courseId}`);
        }
      } catch (err) {
        console.error(`✗ Error assigning staff ${staffId} to course ${courseId}: ${err.message}`);
      }
    }

    console.log(`\n✅ Created ${assignmentCount} staff assignment(s)\n`);

    // Also create some schedule entries
    const [schedules] = await pool.query(
      'SELECT COUNT(*) as count FROM course_schedule'
    );

    if (schedules[0].count === 0) {
      console.log('Adding sample schedule entries...\n');
      
      const days = ['Monday', 'Wednesday', 'Friday'];
      const times = [
        { start: '10:00:00', end: '11:30:00' },
        { start: '14:00:00', end: '15:30:00' }
      ];

      for (const course of courses) {
        for (let i = 0; i < days.length && i < times.length; i++) {
          try {
            await pool.query(
              `INSERT INTO course_schedule 
               (course_id, doctor_id, day_of_week, start_time, end_time, room_name, is_active)
               VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
              [
                course.entity_id,
                doctorId,
                days[i],
                times[i].start,
                times[i].end,
                `Room ${100 + course.entity_id}`
              ]
            );
            console.log(`✓ Added ${days[i]} ${times[i].start}-${times[i].end} for course ${course.entity_id}`);
          } catch (err) {
            console.error(`Error adding schedule: ${err.message}`);
          }
        }
      }
    }

    console.log('\n✅ Test data seeded successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Refresh your browser');
    console.log('   2. Go to Courses → View Details');
    console.log('   3. You should see Teaching Assistants and Course Schedule populated!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedTestData();
