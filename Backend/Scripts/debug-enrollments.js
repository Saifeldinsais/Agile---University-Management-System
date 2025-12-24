require('dotenv').config();
const pool = require('./Db_config/DB');
const fs = require('fs');

async function debug() {
  const output = {};
  try {
    // Get enrollments with their student IDs and course IDs
    const [enrollmentsWithValues] = await pool.query(`
      SELECT 
        ee.entity_id AS enrollment_id,
        ee.entity_name,
        ee.created_at,
        vStudent.value_number AS studentId,
        vCourse.value_number AS courseId
      FROM enrollment_entity ee
      LEFT JOIN enrollment_entity_attribute vStudent 
        ON vStudent.entity_id = ee.entity_id 
        AND vStudent.attribute_id = (SELECT attribute_id FROM enrollment_attributes WHERE attribute_name = 'studentId')
      LEFT JOIN enrollment_entity_attribute vCourse 
        ON vCourse.entity_id = ee.entity_id 
        AND vCourse.attribute_id = (SELECT attribute_id FROM enrollment_attributes WHERE attribute_name = 'courseId')
      LIMIT 5
    `);
    output.enrollments = enrollmentsWithValues;

    // Get student IDs and course IDs from enrollments
    const studentIds = enrollmentsWithValues.map(e => e.studentId).filter(Boolean);
    const courseIds = enrollmentsWithValues.map(e => e.courseId).filter(Boolean);

    output.studentIdsFromEnrollments = studentIds;
    output.courseIdsFromEnrollments = courseIds;

    // Check matching students
    if (studentIds.length > 0) {
      const [students] = await pool.query(
        `SELECT entity_id, entity_name, entity_type FROM entities WHERE entity_id IN (${studentIds.join(',')})`,
      );
      output.matchingStudents = students;
    }

    // Check matching courses
    if (courseIds.length > 0) {
      const [courses] = await pool.query(
        `SELECT entity_id, entity_name FROM course_entity WHERE entity_id IN (${courseIds.join(',')})`,
      );
      output.matchingCourses = courses;
    }

    // List all students
    const [allStudents] = await pool.query(
      `SELECT entity_id, entity_name, entity_type FROM entities WHERE entity_type = 'student' LIMIT 5`
    );
    output.allStudentsInDB = allStudents;

    // List all courses
    const [allCourses] = await pool.query(
      `SELECT entity_id, entity_name FROM course_entity LIMIT 5`
    );
    output.allCoursesInDB = allCourses;

    fs.writeFileSync('debug-result.json', JSON.stringify(output, null, 2), 'utf8');
    console.log('Debug output written to debug-result.json');
    process.exit(0);
  } catch (err) {
    output.error = err.message;
    fs.writeFileSync('debug-result.json', JSON.stringify(output, null, 2), 'utf8');
    console.log('Error, check debug-result.json');
    process.exit(1);
  }
}

debug();
