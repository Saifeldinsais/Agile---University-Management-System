const pool = require("../Db_config/DB");

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
        MAX(CASE WHEN ca.attribute_name='code' THEN cea.value_string END) AS code

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

module.exports = {
  viewCourses,
  enrollCourse,
  viewEnrolled,
  dropCourse,
};
