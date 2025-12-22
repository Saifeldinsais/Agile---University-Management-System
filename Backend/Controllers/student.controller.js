const pool = require("../Db_config/DB");
const JWT = require("jsonwebtoken");

const verifyStudent = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1] || req.headers.authorization;
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = JWT.verify(token, process.env.JWT_SECRET || "default_secret_key_change_in_production");
    
    if (decoded.role !== "student") {
      return res.status(403).json({ message: "Access denied. Student-only endpoint." });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/* -------------------- Helpers -------------------- */
const ensureEnrollmentAttr = async (name, type) => {
  const [rows] = await pool.query(
    "SELECT attribute_id FROM enrollment_attributes WHERE attribute_name=? LIMIT 1",
    [name]
  );
  if (rows.length) return rows[0].attribute_id;

  const [ins] = await pool.query(
    "INSERT INTO enrollment_attributes (attribute_name, data_type) VALUES (?, ?)",
    [name, type]
  );
  return ins.insertId;
};

const initEnrollmentAttributes = async () => {
  // attributes we need for Enrollment EAV
  await ensureEnrollmentAttr("studentId", "int");  // Changed from "reference"
  await ensureEnrollmentAttr("courseId", "int");   // Changed from "reference"
  await ensureEnrollmentAttr("status", "string");
  await ensureEnrollmentAttr("grade", "float");    // Changed from "decimal"
};

const getEnrollmentAttrId = async (name) => {
  const [rows] = await pool.query(
    "SELECT attribute_id FROM enrollment_attributes WHERE attribute_name=? LIMIT 1",
    [name]
  );
  return rows[0]?.attribute_id || null;
};

const findEnrollmentByStudentCourse = async (studentId, courseId) => {
  const studentAttrId = await getEnrollmentAttrId("studentId");
  const courseAttrId = await getEnrollmentAttrId("courseId");
  if (!studentAttrId || !courseAttrId) return null;

  const [rows] = await pool.query(
    `SELECT ee.entity_id
     FROM enrollment_entity ee
     JOIN enrollment_entity_attribute v1
       ON v1.entity_id = ee.entity_id
      AND v1.attribute_id = ?
      AND v1.value_number = ?
     JOIN enrollment_entity_attribute v2
       ON v2.entity_id = ee.entity_id
      AND v2.attribute_id = ?
      AND v2.value_number = ?
     LIMIT 1`,
    [studentAttrId, studentId, courseAttrId, courseId]
  );

  return rows[0]?.entity_id || null;
};

const upsertEnrollmentValueString = async (enrollmentId, attrId, valueString) => {
  const [rows] = await pool.query(
    "SELECT value_id FROM enrollment_entity_attribute WHERE entity_id=? AND attribute_id=? LIMIT 1",
    [enrollmentId, attrId]
  );

  if (rows.length) {
    await pool.query(
      "UPDATE enrollment_entity_attribute SET value_string=? WHERE value_id=?",
      [valueString, rows[0].value_id]
    );
  } else {
    await pool.query(
      "INSERT INTO enrollment_entity_attribute (entity_id, attribute_id, value_string) VALUES (?, ?, ?)",
      [enrollmentId, attrId, valueString]
    );
  }
};

const ensureCourseAttr = async (name, type) => {
  const [rows] = await pool.query(
    "SELECT attribute_id FROM course_attributes WHERE attribute_name=? LIMIT 1",
    [name]
  );
  if (rows.length) return rows[0].attribute_id;

  const [ins] = await pool.query(
    "INSERT INTO course_attributes (attribute_name, data_type) VALUES (?, ?)",
    [name, type]
  );
  return ins.insertId;
};

const initCourseAttributes = async () => {
  await ensureCourseAttr("instructor", "string");
  await ensureCourseAttr("schedule", "string");
  await ensureCourseAttr("max_students", "int");
  await ensureCourseAttr("enrolled_count", "int");
  await ensureCourseAttr("courseType", "string");
  await ensureCourseAttr("prerequisites", "string");
  await ensureCourseAttr("semester", "string");
};

const getCourseAttrId = async (name) => {
  const [rows] = await pool.query(
    "SELECT attribute_id FROM course_attributes WHERE attribute_name=? LIMIT 1",
    [name]
  );
  return rows[0]?.attribute_id || null;
};

const getCourseAttributeValue = async (courseId, attrName) => {
  const attrId = await getCourseAttrId(attrName);
  if (!attrId) return null;
  
  const [rows] = await pool.query(
    "SELECT value_string, value_number FROM course_entity_attribute WHERE entity_id=? AND attribute_id=? LIMIT 1",
    [courseId, attrId]
  );
  if (rows.length) {
    return rows[0].value_string !== null ? rows[0].value_string : rows[0].value_number;
  }
  return null;
};

const getStudentElectiveCount = async (studentId) => {
  await initEnrollmentAttributes();
  const studentAttrId = await getEnrollmentAttrId("studentId");
  const courseAttrId = await getEnrollmentAttrId("courseId");
  const statusAttrId = await getEnrollmentAttrId("status");
  
  await initCourseAttributes();
  const courseTypeAttrId = await getCourseAttrId("courseType");

  const [rows] = await pool.query(
    `SELECT COUNT(DISTINCT ee.entity_id) AS count
     FROM enrollment_entity ee
     JOIN enrollment_entity_attribute vStudent ON vStudent.entity_id = ee.entity_id AND vStudent.attribute_id = ? AND vStudent.value_number = ?
     JOIN enrollment_entity_attribute vCourse ON vCourse.entity_id = ee.entity_id AND vCourse.attribute_id = ?
     JOIN enrollment_entity_attribute vStatus ON vStatus.entity_id = ee.entity_id AND vStatus.attribute_id = ?
     JOIN course_entity_attribute cea ON cea.entity_id = vCourse.value_number AND cea.attribute_id = ?
     WHERE vStatus.value_string IN ('pending', 'accepted') AND cea.value_string = 'elective'`,
    [studentAttrId, studentId, courseAttrId, statusAttrId, courseTypeAttrId]
  );
  
  return rows[0]?.count || 0;
};

/* -------------------- Controllers -------------------- */

// 1) viewCourses  (Course EAV)
const viewCourses = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        ce.entity_id AS _id,
        MAX(CASE WHEN ca.attribute_name='title' THEN cea.value_string END) AS title,
        MAX(CASE WHEN ca.attribute_name='code' THEN cea.value_string END) AS code,
        MAX(CASE WHEN ca.attribute_name='description' THEN cea.value_string END) AS description,
        MAX(CASE WHEN ca.attribute_name='credits' THEN cea.value_number END) AS credits,
        MAX(CASE WHEN ca.attribute_name='department' THEN cea.value_string END) AS department
      FROM course_entity ce
      LEFT JOIN course_entity_attribute cea ON ce.entity_id = cea.entity_id
      LEFT JOIN course_attributes ca ON cea.attribute_id = ca.attribute_id
      GROUP BY ce.entity_id
      ORDER BY ce.entity_id DESC;
    `);

    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching courses", error: error.message });
  }
};

// 2) enrollCourse  (Enrollment EAV)
const enrollCourse = async (req, res) => {
  try {
    await initEnrollmentAttributes();

    const { studentId, courseId } = req.body;
    if (!studentId || !courseId) {
      return res.status(400).json({ message: "studentId and courseId are required" });
    }

    // check student exists (users EAV)
    const [[st]] = await pool.query(
      "SELECT entity_id FROM entities WHERE entity_id=? AND entity_type='student' LIMIT 1",
      [studentId]
    );
    if (!st) return res.status(404).json({ message: "Student not found" });

    // check course exists (course EAV)
    const [[cr]] = await pool.query(
      "SELECT entity_id FROM course_entity WHERE entity_id=? LIMIT 1",
      [courseId]
    );
    if (!cr) return res.status(404).json({ message: "Course not found" });

    // check exists enrollment
    const existsId = await findEnrollmentByStudentCourse(Number(studentId), Number(courseId));
    if (existsId) {
      return res.status(400).json({ message: "Student already enrolled in this course" });
    }

    // create enrollment entity
    const entityName = `enrollment-${studentId}-${courseId}`;
    const [ins] = await pool.query(
      "INSERT INTO enrollment_entity (entity_type, entity_name) VALUES (?, ?)",
      ["enrollment", entityName]
    );
    const enrollmentId = ins.insertId;

    // attribute ids
    const studentAttrId = await getEnrollmentAttrId("studentId");
    const courseAttrId = await getEnrollmentAttrId("courseId");
    const statusAttrId = await getEnrollmentAttrId("status");
    const gradeAttrId = await getEnrollmentAttrId("grade");

    // values
    await pool.query(
      "INSERT INTO enrollment_entity_attribute (entity_id, attribute_id, value_number) VALUES (?, ?, ?)",
      [enrollmentId, studentAttrId, Number(studentId)]
    );
    await pool.query(
      "INSERT INTO enrollment_entity_attribute (entity_id, attribute_id, value_number) VALUES (?, ?, ?)",
      [enrollmentId, courseAttrId, Number(courseId)]
    );
    await pool.query(
      "INSERT INTO enrollment_entity_attribute (entity_id, attribute_id, value_string) VALUES (?, ?, ?)",
      [enrollmentId, statusAttrId, "pending"]
    );
    await pool.query(
      "INSERT INTO enrollment_entity_attribute (entity_id, attribute_id, value_number) VALUES (?, ?, ?)",
      [enrollmentId, gradeAttrId, null]
    );

    // Emit real-time event for admin dashboard
    const io = req.app.get("io");
    if (io) {
      io.to("admin").emit("enrollment-created", {
        id: enrollmentId,
        studentId: Number(studentId),
        courseId: Number(courseId),
        status: "PENDING",
        createdAt: new Date().toISOString()
      });
    }

    return res.status(201).json({
      message: "Student enrolled successfully",
      enrollment: {
        id: enrollmentId,
        studentId: Number(studentId),
        courseId: Number(courseId),
        status: "pending",
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Error enrolling student", error: error.message });
  }
};

// 3) viewEnrolled (Enrollment EAV + Course EAV)
const viewEnrolled = async (req, res) => {
  try {
    await initEnrollmentAttributes();

    const { studentId } = req.params;

    // validate student exists
    const [[st]] = await pool.query(
      "SELECT entity_id FROM entities WHERE entity_id=? AND entity_type='student' LIMIT 1",
      [studentId]
    );
    if (!st) return res.status(404).json({ message: "Student not found" });

    const studentAttrId = await getEnrollmentAttrId("studentId");
    const courseAttrId = await getEnrollmentAttrId("courseId");
    const statusAttrId = await getEnrollmentAttrId("status");
    const gradeAttrId = await getEnrollmentAttrId("grade");

    const [rows] = await pool.query(
      `
      SELECT
        ee.entity_id AS enrollmentId,
        vCourse.value_number AS courseId,
        vStatus.value_string AS status,
        vGrade.value_number AS grade,

        MAX(CASE WHEN ca.attribute_name='title' THEN cea.value_string END) AS title,
        MAX(CASE WHEN ca.attribute_name='code' THEN cea.value_string END) AS code,
        MAX(CASE WHEN ca.attribute_name='department' THEN cea.value_string END) AS department,
        MAX(CASE WHEN ca.attribute_name='credits' THEN cea.value_number END) AS credits

      FROM enrollment_entity ee
      JOIN enrollment_entity_attribute vStudent
        ON vStudent.entity_id = ee.entity_id
       AND vStudent.attribute_id = ?
       AND vStudent.value_number = ?

      JOIN enrollment_entity_attribute vCourse
        ON vCourse.entity_id = ee.entity_id
       AND vCourse.attribute_id = ?

      LEFT JOIN enrollment_entity_attribute vStatus
        ON vStatus.entity_id = ee.entity_id
       AND vStatus.attribute_id = ?

      LEFT JOIN enrollment_entity_attribute vGrade
        ON vGrade.entity_id = ee.entity_id
       AND vGrade.attribute_id = ?

      LEFT JOIN course_entity ce
        ON ce.entity_id = vCourse.value_number

      LEFT JOIN course_entity_attribute cea
        ON cea.entity_id = ce.entity_id

      LEFT JOIN course_attributes ca
        ON ca.attribute_id = cea.attribute_id

      GROUP BY ee.entity_id, vCourse.value_number, vStatus.value_string, vGrade.value_number
      ORDER BY ee.entity_id DESC;
      `,
      [studentAttrId, Number(studentId), courseAttrId, statusAttrId, gradeAttrId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "No enrolled courses found for this student" });
    }

    return res.status(200).json({
      message: "Enrolled courses fetched successfully",
      courses: rows,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching enrolled courses", error: error.message });
  }
};

// 4) dropCourse (update status in Enrollment EAV)
const dropCourse = async (req, res) => {
  try {
    await initEnrollmentAttributes();

    const { studentId, courseId } = req.body;
    if (!studentId || !courseId) {
      return res.status(400).json({ message: "studentId and courseId are required" });
    }

    const enrollmentId = await findEnrollmentByStudentCourse(Number(studentId), Number(courseId));
    if (!enrollmentId) return res.status(404).json({ message: "Enrollment not found" });

    const statusAttrId = await getEnrollmentAttrId("status");

    // read current status
    const [[cur]] = await pool.query(
      "SELECT value_string FROM enrollment_entity_attribute WHERE entity_id=? AND attribute_id=? LIMIT 1",
      [enrollmentId, statusAttrId]
    );

    if (cur?.value_string === "drop") {
      return res.status(400).json({ message: "Already requested to drop" });
    }

    await upsertEnrollmentValueString(enrollmentId, statusAttrId, "drop");

    // Emit real-time event for admin dashboard
    const io = req.app.get("io");
    if (io) {
      io.to("admin").emit("enrollment-drop-requested", {
        enrollmentId,
        studentId: Number(studentId),
        courseId: Number(courseId),
        status: "DROP",
        requestedAt: new Date().toISOString()
      });
    }

    return res.status(200).json({
      message: "Course status updated to dropped",
      enrollmentId,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error updating course status", error: error.message });
  }
};

const getAvailableElectives = async (req, res) => {
  try {
    await initCourseAttributes();
    
    const courseTypeAttrId = await getCourseAttrId("courseType");
    const instructorAttrId = await getCourseAttrId("instructor");
    const scheduleAttrId = await getCourseAttrId("schedule");
    const maxStudentsAttrId = await getCourseAttrId("max_students");
    const enrolledCountAttrId = await getCourseAttrId("enrolled_count");

    const [rows] = await pool.query(
      `SELECT
        ce.entity_id AS _id,
        MAX(CASE WHEN ca.attribute_name='title' THEN cea.value_string END) AS title,
        MAX(CASE WHEN ca.attribute_name='code' THEN cea.value_string END) AS code,
        MAX(CASE WHEN ca.attribute_name='description' THEN cea.value_string END) AS description,
        MAX(CASE WHEN ca.attribute_name='credits' THEN cea.value_number END) AS credits,
        MAX(CASE WHEN ca.attribute_name='department' THEN cea.value_string END) AS department,
        MAX(CASE WHEN ca.attribute_id=? THEN cea.value_string END) AS instructor,
        MAX(CASE WHEN ca.attribute_id=? THEN cea.value_string END) AS schedule,
        MAX(CASE WHEN ca.attribute_id=? THEN cea.value_number END) AS max_students,
        MAX(CASE WHEN ca.attribute_id=? THEN cea.value_number END) AS enrolled_count
      FROM course_entity ce
      LEFT JOIN course_entity_attribute cea ON ce.entity_id = cea.entity_id
      LEFT JOIN course_attributes ca ON cea.attribute_id = ca.attribute_id
      WHERE EXISTS (
        SELECT 1 FROM course_entity_attribute cea2
        WHERE cea2.entity_id = ce.entity_id 
        AND cea2.attribute_id = ?
        AND cea2.value_string = 'elective'
      )
      GROUP BY ce.entity_id
      ORDER BY ce.entity_id DESC`,
      [instructorAttrId, scheduleAttrId, maxStudentsAttrId, enrolledCountAttrId, courseTypeAttrId]
    );

    const electives = rows.map(e => ({
      ...e,
      capacity: e.max_students || 0,
      available_seats: (e.max_students || 0) - (e.enrolled_count || 0)
    }));

    return res.status(200).json({
      message: "Available electives fetched successfully",
      electives
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching electives", error: error.message });
  }
};

const selectElective = async (req, res) => {
  try {
    await initEnrollmentAttributes();
    await initCourseAttributes();

    const studentId = req.user.id;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    const [[st]] = await pool.query(
      "SELECT entity_id FROM entities WHERE entity_id=? AND entity_type='student' LIMIT 1",
      [studentId]
    );
    if (!st) return res.status(404).json({ message: "Student not found" });

    const [[cr]] = await pool.query(
      "SELECT entity_id FROM course_entity WHERE entity_id=? LIMIT 1",
      [courseId]
    );
    if (!cr) return res.status(404).json({ message: "Course not found" });

    const courseType = await getCourseAttributeValue(courseId, "courseType");
    if (courseType !== "elective") {
      return res.status(400).json({ message: "This course is not an elective" });
    }

    const existsId = await findEnrollmentByStudentCourse(Number(studentId), Number(courseId));
    if (existsId) {
      return res.status(400).json({ message: "You are already enrolled in this elective" });
    }

    const maxStudents = await getCourseAttributeValue(courseId, "max_students");
    const enrolledCount = await getCourseAttributeValue(courseId, "enrolled_count") || 0;
    
    if (maxStudents && enrolledCount >= maxStudents) {
      return res.status(400).json({ message: "Course is full. No available seats." });
    }

    const currentElectiveCount = await getStudentElectiveCount(studentId);
    if (currentElectiveCount >= 3) {
      return res.status(400).json({ message: "Maximum number of electives (3) already selected" });
    }

    const prerequisites = await getCourseAttributeValue(courseId, "prerequisites");
    if (prerequisites) {
      try {
        const prereqList = JSON.parse(prerequisites);
        if (Array.isArray(prereqList) && prereqList.length > 0) {
          const studentAttrId = await getEnrollmentAttrId("studentId");
          const courseAttrId = await getEnrollmentAttrId("courseId");
          const statusAttrId = await getEnrollmentAttrId("status");

          for (const prereqId of prereqList) {
            const prereqEnrollment = await findEnrollmentByStudentCourse(Number(studentId), Number(prereqId));
            if (!prereqEnrollment) {
              return res.status(400).json({ message: `Prerequisite course (ID: ${prereqId}) not completed` });
            }

            const statusAttrId2 = await getEnrollmentAttrId("status");
            const [[statusRow]] = await pool.query(
              "SELECT value_string FROM enrollment_entity_attribute WHERE entity_id=? AND attribute_id=? LIMIT 1",
              [prereqEnrollment, statusAttrId2]
            );
            if (statusRow?.value_string !== "accepted") {
              return res.status(400).json({ message: `Prerequisite course (ID: ${prereqId}) must be accepted/completed` });
            }
          }
        }
      } catch (e) {
      }
    }

    const entityName = `enrollment-${studentId}-${courseId}`;
    const [ins] = await pool.query(
      "INSERT INTO enrollment_entity (entity_type, entity_name) VALUES (?, ?)",
      ["enrollment", entityName]
    );
    const enrollmentId = ins.insertId;

    const studentAttrId = await getEnrollmentAttrId("studentId");
    const courseAttrId = await getEnrollmentAttrId("courseId");
    const statusAttrId = await getEnrollmentAttrId("status");
    const gradeAttrId = await getEnrollmentAttrId("grade");

    await pool.query(
      "INSERT INTO enrollment_entity_attribute (entity_id, attribute_id, value_number) VALUES (?, ?, ?)",
      [enrollmentId, studentAttrId, Number(studentId)]
    );
    await pool.query(
      "INSERT INTO enrollment_entity_attribute (entity_id, attribute_id, value_number) VALUES (?, ?, ?)",
      [enrollmentId, courseAttrId, Number(courseId)]
    );
    await pool.query(
      "INSERT INTO enrollment_entity_attribute (entity_id, attribute_id, value_string) VALUES (?, ?, ?)",
      [enrollmentId, statusAttrId, "pending"]
    );
    await pool.query(
      "INSERT INTO enrollment_entity_attribute (entity_id, attribute_id, value_number) VALUES (?, ?, ?)",
      [enrollmentId, gradeAttrId, null]
    );

    const enrolledCountAttrId = await getCourseAttrId("enrolled_count");
    if (enrolledCountAttrId) {
      const currentCount = await getCourseAttributeValue(courseId, "enrolled_count") || 0;
      const [existing] = await pool.query(
        "SELECT value_id FROM course_entity_attribute WHERE entity_id=? AND attribute_id=? LIMIT 1",
        [courseId, enrolledCountAttrId]
      );
      if (existing.length) {
        await pool.query(
          "UPDATE course_entity_attribute SET value_number=? WHERE value_id=?",
          [currentCount + 1, existing[0].value_id]
        );
      } else {
        await pool.query(
          "INSERT INTO course_entity_attribute (entity_id, attribute_id, value_number) VALUES (?, ?, ?)",
          [courseId, enrolledCountAttrId, currentCount + 1]
        );
      }
    }

    return res.status(201).json({
      message: "Elective selected successfully",
      enrollment: {
        id: enrollmentId,
        studentId: Number(studentId),
        courseId: Number(courseId),
        status: "pending",
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Error selecting elective", error: error.message });
  }
};

const getTimetable = async (req, res) => {
  try {
    await initEnrollmentAttributes();
    await initCourseAttributes();

    const studentId = req.user.id;

    const [[st]] = await pool.query(
      "SELECT entity_id FROM entities WHERE entity_id=? AND entity_type='student' LIMIT 1",
      [studentId]
    );
    if (!st) return res.status(404).json({ message: "Student not found" });

    const studentAttrId = await getEnrollmentAttrId("studentId");
    const courseAttrId = await getEnrollmentAttrId("courseId");
    const statusAttrId = await getEnrollmentAttrId("status");

    const scheduleAttrId = await getCourseAttrId("schedule");
    const instructorAttrId = await getCourseAttrId("instructor");

    const [rows] = await pool.query(
      `SELECT
        vCourse.value_number AS courseId,
        MAX(CASE WHEN ca.attribute_name='title' THEN cea.value_string END) AS title,
        MAX(CASE WHEN ca.attribute_name='code' THEN cea.value_string END) AS code,
        MAX(CASE WHEN ca.attribute_name='credits' THEN cea.value_number END) AS credits,
        MAX(CASE WHEN ca.attribute_id=? THEN cea.value_string END) AS instructor,
        MAX(CASE WHEN ca.attribute_id=? THEN cea.value_string END) AS schedule
      FROM enrollment_entity ee
      JOIN enrollment_entity_attribute vStudent ON vStudent.entity_id = ee.entity_id AND vStudent.attribute_id = ? AND vStudent.value_number = ?
      JOIN enrollment_entity_attribute vCourse ON vCourse.entity_id = ee.entity_id AND vCourse.attribute_id = ?
      JOIN enrollment_entity_attribute vStatus ON vStatus.entity_id = ee.entity_id AND vStatus.attribute_id = ?
      LEFT JOIN course_entity ce ON ce.entity_id = vCourse.value_number
      LEFT JOIN course_entity_attribute cea ON cea.entity_id = ce.entity_id
      LEFT JOIN course_attributes ca ON ca.attribute_id = cea.attribute_id
      WHERE vStatus.value_string IN ('pending', 'accepted')
      GROUP BY vCourse.value_number
      ORDER BY ce.entity_id DESC`,
      [instructorAttrId, scheduleAttrId, studentAttrId, Number(studentId), courseAttrId, statusAttrId]
    );

    const timetable = rows.map(course => {
      let schedule = null;
      try {
        if (course.schedule) {
          schedule = JSON.parse(course.schedule);
        }
      } catch (e) {
        schedule = course.schedule;
      }

      return {
        courseId: course.courseId,
        title: course.title,
        code: course.code,
        credits: course.credits,
        instructor: course.instructor || "TBA",
        schedule: schedule || []
      };
    });

    return res.status(200).json({
      message: "Timetable fetched successfully",
      timetable
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching timetable", error: error.message });
  }
};

module.exports = {
  viewCourses,
  enrollCourse,
  viewEnrolled,
  dropCourse,
  getAvailableElectives,
  selectElective,
  getTimetable,
  verifyStudent,
};
