const pool = require("../Db_config/DB");
const doctorService = require("../Services/doctor.service");
const studentService = require("../Services/student.service.js");
const AssignmentService = require("../Services/assignment.service");

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
  await ensureEnrollmentAttr("finalGrade", "float"); // Final grade after course completion
  await ensureEnrollmentAttr("completionStatus", "string"); // 'completed', 'in-progress', 'failed'
  await ensureEnrollmentAttr("completionDate", "string"); // Date when course was completed
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

// 0) getStudentProfile
const getStudentProfile = async (req, res) => {
  try {
    const { studentId } = req.params;

    const [rows] = await pool.query(
      `SELECT 
        e.entity_id,
        MAX(CASE WHEN a.attribute_name='username' THEN ea.value_string END) AS username,
        MAX(CASE WHEN a.attribute_name='email' THEN ea.value_string END) AS email
      FROM entities e
      LEFT JOIN entity_attribute ea ON e.entity_id = ea.entity_id
      LEFT JOIN attributes a ON ea.attribute_id = a.attribute_id
      WHERE e.entity_id = ? AND e.entity_type = 'student'
      GROUP BY e.entity_id`,
      [studentId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.status(200).json({ user: rows[0] });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching student profile", error: error.message });
  }
};

// 1) viewCourses  (Course EAV)
const viewCourses = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        ce.entity_id AS _id,
        MAX(CASE WHEN ca.attribute_name='title' THEN cea.value_string END) AS title,
        MAX(CASE WHEN ca.attribute_name='code' THEN cea.value_string END) AS code,
        MAX(CASE WHEN ca.attribute_name='description' THEN cea.value_string END) AS description,
        MAX(CASE WHEN ca.attribute_name='credits' THEN COALESCE(cea.value_number, CAST(cea.value_string AS UNSIGNED)) END) AS credits,
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
        MAX(CASE WHEN ca.attribute_name='credits' THEN COALESCE(cea.value_number, CAST(cea.value_string AS UNSIGNED)) END) AS credits

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
const viewCourseAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await doctorService.getCourseAssignmentsForStudents(courseId);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    return res.status(200).json({ assignments: result.data });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

// GET /student/staff/:staffId/office-hours
const getStaffOfficeHours = async (req, res) => {
  try {
    const studentEntityId = req.user?.id;
    if (!studentEntityId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }

    const { staffId } = req.params;

    const result = await studentService.getOfficeHoursByStaffId(staffId);

    if (!result.success) {
      return res.status(400).json({ status: "fail", message: result.message });
    }

    return res.status(200).json({ status: "success", data: result.data });
  } catch (e) {
    console.error("getStaffOfficeHours controller error:", e);
    return res.status(500).json({ status: "error", message: e.message });
  }
};

// POST /student/staff/:staffId/meeting-requests
const createMeetingRequestForStaff = async (req, res) => {
  try {
    const studentEntityId = req.user?.id;
    const studentName =
      req.user?.name || req.user?.username || req.user?.email || "Student";

    if (!studentEntityId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }

    const { staffId } = req.params;
    const { reason, requestedDate, requestedTime } = req.body;

    if (!reason?.trim()) {
      return res.status(400).json({ status: "fail", message: "reason is required" });
    }
    if (!requestedDate || !requestedTime) {
      return res.status(400).json({
        status: "fail",
        message: "requestedDate and requestedTime are required",
      });
    }

    const result = await studentService.createMeetingRequestForStaff({
      staffId,
      studentEntityId,
      studentName,
      reason,
      requestedDate,
      requestedTime,
    });

    if (!result.success) {
      return res.status(400).json({ status: "fail", message: result.message });
    }

    return res.status(201).json({
      status: "success",
      message: "Meeting request submitted",
      data: result.data,
    });
  } catch (e) {
    console.error("createMeetingRequestForStaff controller error:", e);
    return res.status(500).json({ status: "error", message: e.message });
  }
};


// GET /student/meeting-requests
const getMyMeetingRequests = async (req, res) => {
  try {
    const studentEntityId = req.user?.id;
    if (!studentEntityId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }

    const result = await studentService.getMyMeetingRequests(studentEntityId);

    if (!result.success) {
      return res.status(400).json({ status: "fail", message: result.message });
    }

    return res.status(200).json({ status: "success", data: result.data });
  } catch (e) {
    console.error("getMyMeetingRequests controller error:", e);
    return res.status(500).json({ status: "error", message: e.message });
  }
};
const getCourseInstructors = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!courseId) return res.status(400).json({ message: "courseId is required" });

    const result = await AssignmentService.getAssignmentsByCourse(courseId);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    // keep only active + doctors/instructors (choose the roles you want)
    const instructors = (result.data || [])
      .filter(a => (a.status || "active") === "active")
      .filter(a => ["doctor", "instructor"].includes(String(a.role || "").toLowerCase()))
      .map(a => ({
        staffId: a.staff?.id,
        name: a.staff?.name,
        email: a.staff?.email,
        role: a.role,
        department: a.staff?.department || a.department || "",
      }));

    return res.status(200).json({ status: "success", data: instructors });
  } catch (e) {
    console.error("getCourseInstructors error:", e);
    return res.status(500).json({ message: e.message });
  }
};

// Get completed courses with final grades and calculate GPA
const getCompletedCoursesWithGrades = async (req, res) => {
  try {
    await initEnrollmentAttributes();

    const { studentId } = req.params;
    if (!studentId) {
      return res.status(400).json({ message: "studentId is required" });
    }

    const studentIdNum = Number(studentId);

    // Get all enrollment attributes IDs
    const studentAttrId = await getEnrollmentAttrId("studentId");
    const courseAttrId = await getEnrollmentAttrId("courseId");
    // Updated attribute names to match doctor service and DB
    const gradeAttrId = await getEnrollmentAttrId("grade"); // was finalGrade
    const statusAttrId = await getEnrollmentAttrId("status"); // was completionStatus

    if (!studentAttrId || !courseAttrId || !gradeAttrId) {
      return res.status(500).json({ message: "Enrollment attributes not found" });
    }

    // Get all enrollments with grades for the student
    // We fetch ALL graded enrollments to calculate GPA correctly (including Fs)
    const [enrollments] = await pool.query(`
      SELECT 
        ee.entity_id,
        MAX(CASE WHEN ea.attribute_name='courseId' THEN eea.value_number END) AS courseId,
        MAX(CASE WHEN ea.attribute_name='grade' THEN eea.value_number END) AS grade,
        MAX(CASE WHEN ea.attribute_name='letterGrade' THEN eea.value_string END) AS letterGrade,
        MAX(CASE WHEN ea.attribute_name='status' THEN eea.value_string END) AS status
      FROM enrollment_entity ee
      JOIN enrollment_entity_attribute eea ON ee.entity_id = eea.entity_id
      JOIN enrollment_attributes ea ON eea.attribute_id = ea.attribute_id
      WHERE ee.entity_id IN (
        SELECT DISTINCT eea2.entity_id
        FROM enrollment_entity_attribute eea2
        JOIN enrollment_attributes ea2 ON eea2.attribute_id = ea2.attribute_id
        WHERE ea2.attribute_name='studentId' AND eea2.value_number=?
      )
      AND ea.attribute_name IN ('courseId', 'grade', 'letterGrade', 'status')
      GROUP BY ee.entity_id
      HAVING grade IS NOT NULL
    `, [studentIdNum]);

    if (!enrollments || enrollments.length === 0) {
      return res.status(200).json({
        completedCourses: [],
        gpa: 0,
        totalCredits: 0
      });
    }

    // Fetch course details for enrollments
    const courseIds = enrollments.map(e => e.courseId).filter(Boolean);

    let completedCourses = [];
    let totalCredits = 0; // successfully completed credits (no F)
    let totalAttemptedCredits = 0; // for GPA calc (includes F)
    let totalGradePoints = 0; // for GPA calc

    if (courseIds.length > 0) {
      const placeholders = courseIds.map(() => '?').join(',');
      const [courses] = await pool.query(`
        SELECT
          ce.entity_id AS courseId,
          MAX(CASE WHEN ca.attribute_name='title' THEN cea.value_string END) AS title,
          MAX(CASE WHEN ca.attribute_name='code' THEN cea.value_string END) AS code,
          MAX(CASE WHEN ca.attribute_name='credits' THEN COALESCE(cea.value_number, CAST(cea.value_string AS UNSIGNED)) END) AS credits,
          MAX(CASE WHEN ca.attribute_name='department' THEN cea.value_string END) AS department
        FROM course_entity ce
        LEFT JOIN course_entity_attribute cea ON ce.entity_id = cea.entity_id
        LEFT JOIN course_attributes ca ON cea.attribute_id = ca.attribute_id
        WHERE ce.entity_id IN (${placeholders})
        GROUP BY ce.entity_id
      `, courseIds);

      // Debug logging
      console.log('[getCompletedCoursesWithGrades] courseIds:', courseIds);
      console.log('[getCompletedCoursesWithGrades] courses result:', JSON.stringify(courses, null, 2));
      console.log('[getCompletedCoursesWithGrades] enrollments:', JSON.stringify(enrollments, null, 2));

      // Merge course details with enrollment grades
      completedCourses = enrollments.map(enrollment => {
        // Use Number() to ensure proper comparison (handles DECIMAL/string types)
        const enrollmentCourseId = Number(enrollment.courseId);
        const course = courses.find(c => Number(c.courseId) === enrollmentCourseId);
        const grade = parseFloat(enrollment.grade) || 0;
        // Parse credits, handling both number and string formats
        const credits = course?.credits ? Number(course.credits) : 0;

        if (course && credits > 0) {
          // GPA Calculation: Include everything
          totalAttemptedCredits += credits;
          totalGradePoints += (grade * credits);

          // Completed Credits: Only if grade > 0 (passing)
          if (grade > 0) {
            totalCredits += credits;
          }
        }

        return {
          enrollmentId: enrollment.entity_id,
          courseId: enrollmentCourseId,
          title: course?.title || 'Unknown Course',
          code: course?.code || '',
          credits: credits,
          department: course?.department || '',
          finalGrade: grade,
          letterGrade: enrollment.letterGrade || null,  // Use stored letter grade
          status: enrollment.status || (grade > 0 ? 'COMPLETED' : 'FAILED')
        };
      });
    }

    // Calculate GPA (weighted by attempted credits)
    const gpa = totalAttemptedCredits > 0
      ? (totalGradePoints / totalAttemptedCredits).toFixed(2)
      : 0;

    // Filter the list to only return actually completed (passing) courses to the frontend
    // while preserving the correct GPA calculation that included the Fs.
    const passingCourses = completedCourses.filter(c => c.finalGrade > 0);

    return res.status(200).json({
      completedCourses: passingCourses,
      gpa: parseFloat(gpa),
      totalCredits
    });

  } catch (error) {
    console.error("getCompletedCoursesWithGrades error:", error);
    return res.status(500).json({ message: "Error fetching completed courses", error: error.message });
  }
};

// Update student enrollment with final grade and mark as completed
const updateEnrollmentWithFinalGrade = async (req, res) => {
  try {
    await initEnrollmentAttributes();

    const { enrollmentId, finalGrade, completionStatus } = req.body;
    if (!enrollmentId || finalGrade === undefined || !completionStatus) {
      return res.status(400).json({ message: "enrollmentId, finalGrade, and completionStatus are required" });
    }

    // Get attribute IDs
    const finalGradeAttrId = await getEnrollmentAttrId("finalGrade");
    const completionStatusAttrId = await getEnrollmentAttrId("completionStatus");
    const completionDateAttrId = await getEnrollmentAttrId("completionDate");

    if (!finalGradeAttrId || !completionStatusAttrId || !completionDateAttrId) {
      return res.status(500).json({ message: "Enrollment attributes not found" });
    }

    // Check enrollment exists
    const [[enrollment]] = await pool.query(
      "SELECT entity_id FROM enrollment_entity WHERE entity_id=? LIMIT 1",
      [enrollmentId]
    );
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // Upsert finalGrade
    const [[existingGrade]] = await pool.query(
      "SELECT value_id FROM enrollment_entity_attribute WHERE entity_id=? AND attribute_id=? LIMIT 1",
      [enrollmentId, finalGradeAttrId]
    );

    if (existingGrade) {
      await pool.query(
        "UPDATE enrollment_entity_attribute SET value_number=? WHERE value_id=?",
        [finalGrade, existingGrade.value_id]
      );
    } else {
      await pool.query(
        "INSERT INTO enrollment_entity_attribute (entity_id, attribute_id, value_number) VALUES (?, ?, ?)",
        [enrollmentId, finalGradeAttrId, finalGrade]
      );
    }

    // Upsert completionStatus
    const [[existingStatus]] = await pool.query(
      "SELECT value_id FROM enrollment_entity_attribute WHERE entity_id=? AND attribute_id=? LIMIT 1",
      [enrollmentId, completionStatusAttrId]
    );

    if (existingStatus) {
      await pool.query(
        "UPDATE enrollment_entity_attribute SET value_string=? WHERE value_id=?",
        [completionStatus, existingStatus.value_id]
      );
    } else {
      await pool.query(
        "INSERT INTO enrollment_entity_attribute (entity_id, attribute_id, value_string) VALUES (?, ?, ?)",
        [enrollmentId, completionStatusAttrId, completionStatus]
      );
    }

    // Upsert completionDate if course is completed
    if (completionStatus === 'completed') {
      const completionDate = new Date().toISOString().split('T')[0];
      const [[existingDate]] = await pool.query(
        "SELECT value_id FROM enrollment_entity_attribute WHERE entity_id=? AND attribute_id=? LIMIT 1",
        [enrollmentId, completionDateAttrId]
      );

      if (existingDate) {
        await pool.query(
          "UPDATE enrollment_entity_attribute SET value_string=? WHERE value_id=?",
          [completionDate, existingDate.value_id]
        );
      } else {
        await pool.query(
          "INSERT INTO enrollment_entity_attribute (entity_id, attribute_id, value_string) VALUES (?, ?, ?)",
          [enrollmentId, completionDateAttrId, completionDate]
        );
      }
    }

    return res.status(200).json({
      status: "success",
      message: "Enrollment updated with final grade",
      data: {
        enrollmentId,
        finalGrade,
        completionStatus
      }
    });

  } catch (error) {
    console.error("updateEnrollmentWithFinalGrade error:", error);
    return res.status(500).json({ message: "Error updating enrollment", error: error.message });
  }
};

// GET /student/my-course-materials
// Returns all course materials for courses the student is enrolled in
const getEnrolledCourseMaterials = async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }

    // Ensure course_resources table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_resources (
          resource_id INT AUTO_INCREMENT PRIMARY KEY,
          course_id INT NOT NULL,
          doctor_id INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          file_name VARCHAR(255) NOT NULL,
          file_path VARCHAR(512) NOT NULL,
          file_type VARCHAR(100),
          file_size BIGINT,
          upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT TRUE,
          INDEX idx_course (course_id),
          INDEX idx_doctor (doctor_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Get studentId and courseId attribute IDs
    const studentAttrId = await getEnrollmentAttrId("studentId");
    const courseAttrId = await getEnrollmentAttrId("courseId");
    const statusAttrId = await getEnrollmentAttrId("status");

    if (!studentAttrId || !courseAttrId) {
      return res.status(500).json({ status: "fail", message: "Enrollment attributes not configured" });
    }

    // Get all courses the student is enrolled in (approved/active status)
    const [enrollments] = await pool.query(`
      SELECT DISTINCT CAST(vCourse.value_number AS UNSIGNED) AS courseId
      FROM enrollment_entity ee
      JOIN enrollment_entity_attribute vStudent
        ON vStudent.entity_id = ee.entity_id
       AND vStudent.attribute_id = ?
       AND CAST(vStudent.value_number AS UNSIGNED) = ?
      JOIN enrollment_entity_attribute vCourse
        ON vCourse.entity_id = ee.entity_id
       AND vCourse.attribute_id = ?
      LEFT JOIN enrollment_entity_attribute vStatus
        ON vStatus.entity_id = ee.entity_id
       AND vStatus.attribute_id = ?
      WHERE vStatus.value_string IS NULL 
         OR UPPER(TRIM(vStatus.value_string)) NOT IN ('REJECTED', 'DROPPED', 'CANCELLED')
    `, [studentAttrId, studentId, courseAttrId, statusAttrId || -1]);

    if (enrollments.length === 0) {
      return res.status(200).json({
        status: "success",
        data: [],
        message: "No enrolled courses found"
      });
    }

    const courseIds = enrollments.map(e => e.courseId);

    // Get course details for enrolled courses
    const placeholders = courseIds.map(() => '?').join(',');
    const [courses] = await pool.query(`
      SELECT
        ce.entity_id AS courseId,
        MAX(CASE WHEN ca.attribute_name='title' THEN cea.value_string END) AS title,
        MAX(CASE WHEN ca.attribute_name='code' THEN cea.value_string END) AS code,
        MAX(CASE WHEN ca.attribute_name='department' THEN cea.value_string END) AS department,
        MAX(CASE WHEN ca.attribute_name='credits' THEN COALESCE(cea.value_number, CAST(cea.value_string AS UNSIGNED)) END) AS credits
      FROM course_entity ce
      LEFT JOIN course_entity_attribute cea ON ce.entity_id = cea.entity_id
      LEFT JOIN course_attributes ca ON cea.attribute_id = ca.attribute_id
      WHERE ce.entity_id IN (${placeholders})
      GROUP BY ce.entity_id
    `, courseIds);

    // Get resources for all enrolled courses
    const [resources] = await pool.query(`
      SELECT 
        resource_id AS resourceId,
        course_id AS courseId,
        title,
        description,
        file_name AS fileName,
        file_path AS filePath,
        file_type AS fileType,
        file_size AS fileSize,
        upload_date AS uploadDate
      FROM course_resources
      WHERE course_id IN (${placeholders}) AND is_active = TRUE
      ORDER BY upload_date DESC
    `, courseIds);

    // Organize resources by course
    const courseMaterials = courses.map(course => {
      const courseResources = resources.filter(r => Number(r.courseId) === Number(course.courseId));
      return {
        courseId: course.courseId,
        code: course.code || '',
        title: course.title || 'Unknown Course',
        department: course.department || '',
        credits: course.credits || 0,
        resourceCount: courseResources.length,
        resources: courseResources.map(r => ({
          resourceId: r.resourceId,
          title: r.title,
          description: r.description,
          fileName: r.fileName,
          filePath: r.filePath,
          fileType: r.fileType,
          fileSize: r.fileSize,
          uploadDate: r.uploadDate
        }))
      };
    });

    // Sort courses by code
    courseMaterials.sort((a, b) => (a.code || '').localeCompare(b.code || ''));

    return res.status(200).json({
      status: "success",
      data: courseMaterials,
      totalCourses: courseMaterials.length,
      totalResources: resources.length
    });

  } catch (error) {
    console.error("getEnrolledCourseMaterials error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// GET /student/my-assessments
// Returns all assessments for enrolled courses, organized by course with grading status
const getMyAssessmentsByCourse = async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }

    // Get studentId and courseId attribute IDs
    const studentAttrId = await getEnrollmentAttrId("studentId");
    const courseAttrId = await getEnrollmentAttrId("courseId");
    const statusAttrId = await getEnrollmentAttrId("status");

    if (!studentAttrId || !courseAttrId) {
      return res.status(500).json({ status: "fail", message: "Enrollment attributes not configured" });
    }

    // Get all courses the student is enrolled in (approved status)
    const [enrollments] = await pool.query(`
      SELECT DISTINCT CAST(vCourse.value_number AS UNSIGNED) AS courseId
      FROM enrollment_entity ee
      JOIN enrollment_entity_attribute vStudent
        ON vStudent.entity_id = ee.entity_id
       AND vStudent.attribute_id = ?
       AND CAST(vStudent.value_number AS UNSIGNED) = ?
      JOIN enrollment_entity_attribute vCourse
        ON vCourse.entity_id = ee.entity_id
       AND vCourse.attribute_id = ?
      LEFT JOIN enrollment_entity_attribute vStatus
        ON vStatus.entity_id = ee.entity_id
       AND vStatus.attribute_id = ?
      WHERE vStatus.value_string IS NULL 
         OR UPPER(TRIM(vStatus.value_string)) = 'APPROVED'
    `, [studentAttrId, studentId, courseAttrId, statusAttrId || -1]);

    if (enrollments.length === 0) {
      return res.status(200).json({
        status: "success",
        data: [],
        summary: { totalCourses: 0, totalAssessments: 0, submittedCount: 0, gradedCount: 0, pendingCount: 0 },
        message: "No enrolled courses found"
      });
    }

    const courseIds = enrollments.map(e => e.courseId);

    // Get course details for enrolled courses
    const placeholders = courseIds.map(() => '?').join(',');
    const [courses] = await pool.query(`
      SELECT
        ce.entity_id AS courseId,
        MAX(CASE WHEN ca.attribute_name='title' THEN cea.value_string END) AS title,
        MAX(CASE WHEN ca.attribute_name='code' THEN cea.value_string END) AS code,
        MAX(CASE WHEN ca.attribute_name='department' THEN cea.value_string END) AS department
      FROM course_entity ce
      LEFT JOIN course_entity_attribute cea ON ce.entity_id = cea.entity_id
      LEFT JOIN course_attributes ca ON cea.attribute_id = ca.attribute_id
      WHERE ce.entity_id IN (${placeholders})
      GROUP BY ce.entity_id
    `, courseIds);

    // Get assessments from BOTH course_assignment_entity AND assignment_entity tables
    let allAssessments = [];

    // Try course_assignment_entity first
    try {
      const [[titleAttr]] = await pool.query(
        "SELECT attribute_id FROM course_assignment_attributes WHERE attribute_name='title' LIMIT 1"
      );
      const [[descAttr]] = await pool.query(
        "SELECT attribute_id FROM course_assignment_attributes WHERE attribute_name='description' LIMIT 1"
      );
      const [[dueDateAttr]] = await pool.query(
        "SELECT attribute_id FROM course_assignment_attributes WHERE attribute_name='dueDate' LIMIT 1"
      );
      const [[totalMarksAttr]] = await pool.query(
        "SELECT attribute_id FROM course_assignment_attributes WHERE attribute_name='totalMarks' LIMIT 1"
      );
      const [[typeAttr]] = await pool.query(
        "SELECT attribute_id FROM course_assignment_attributes WHERE attribute_name='type' LIMIT 1"
      );

      if (titleAttr) {
        const [assessments1] = await pool.query(`
          SELECT
            cae.entity_id AS assessmentId,
            cae.course_id AS courseId,
            cae.created_at AS createdAt,
            vTitle.value_string AS title,
            vDesc.value_string AS description,
            vDue.value_string AS dueDate,
            vMarks.value_number AS totalMarks,
            vType.value_string AS type
          FROM course_assignment_entity cae
          LEFT JOIN course_assignment_entity_attribute vTitle
            ON vTitle.entity_id = cae.entity_id AND vTitle.attribute_id = ?
          LEFT JOIN course_assignment_entity_attribute vDesc
            ON vDesc.entity_id = cae.entity_id AND vDesc.attribute_id = ?
          LEFT JOIN course_assignment_entity_attribute vDue
            ON vDue.entity_id = cae.entity_id AND vDue.attribute_id = ?
          LEFT JOIN course_assignment_entity_attribute vMarks
            ON vMarks.entity_id = cae.entity_id AND vMarks.attribute_id = ?
          LEFT JOIN course_assignment_entity_attribute vType
            ON vType.entity_id = cae.entity_id AND vType.attribute_id = ?
          WHERE cae.course_id IN (${placeholders})
          ORDER BY cae.created_at DESC
        `, [
          titleAttr.attribute_id,
          descAttr?.attribute_id || -1,
          dueDateAttr?.attribute_id || -1,
          totalMarksAttr?.attribute_id || -1,
          typeAttr?.attribute_id || -1,
          ...courseIds
        ]);
        allAssessments = [...allAssessments, ...assessments1];
      }
    } catch (e1) {
      console.log("course_assignment_entity query error:", e1.message);
    }

    // Also try assignment_entity table (used by assignmentSubmission system)
    try {
      const [assessments2] = await pool.query(`
        SELECT 
          ae.entity_id AS assessmentId,
          ae.course_id AS courseId,
          ae.created_at AS createdAt,
          ae.entity_name AS title,
          MAX(CASE WHEN aa.attribute_name='description' THEN aea.value_string END) AS description,
          MAX(CASE WHEN aa.attribute_name IN ('dueDate', 'deadline') THEN aea.value_string END) AS dueDate,
          MAX(CASE WHEN aa.attribute_name IN ('totalMarks', 'marks') THEN aea.value_number END) AS totalMarks,
          MAX(CASE WHEN aa.attribute_name='type' THEN aea.value_string END) AS type
        FROM assignment_entity ae
        LEFT JOIN assignment_entity_attribute aea ON aea.entity_id = ae.entity_id
        LEFT JOIN assignment_attributes aa ON aa.attribute_id = aea.attribute_id
        WHERE ae.course_id IN (${placeholders})
        GROUP BY ae.entity_id
        ORDER BY ae.created_at DESC
      `, courseIds);

      // Merge but avoid duplicates by assessmentId
      const existingIds = new Set(allAssessments.map(a => a.assessmentId));
      for (const a of assessments2) {
        if (!existingIds.has(a.assessmentId)) {
          allAssessments.push(a);
        }
      }
    } catch (e2) {
      console.log("assignment_entity query error:", e2.message);
    }

    // Filter out assessments without titles
    allAssessments = allAssessments.filter(a => a.title);

    // Get submissions from assignment_submission_entity (the correct table!)
    let submissions = [];
    const assessmentIds = allAssessments.map(a => a.assessmentId);

    if (assessmentIds.length > 0) {
      try {
        const assPlaceholders = assessmentIds.map(() => '?').join(',');

        // Query assignment_submission_entity which is the actual submission table
        const [subs] = await pool.query(`
          SELECT 
            ase.entity_id AS submissionId,
            ase.assignment_id AS assignmentId,
            ase.student_id AS studentId,
            MAX(CASE WHEN asa.attribute_name = 'submission_status' THEN asea.value_string END) AS submissionStatus,
            MAX(CASE WHEN asa.attribute_name = 'grade' THEN asea.value_number END) AS grade,
            MAX(CASE WHEN asa.attribute_name = 'feedback' THEN asea.value_string END) AS feedback
          FROM assignment_submission_entity ase
          LEFT JOIN assignment_submission_entity_attribute asea ON asea.entity_id = ase.entity_id
          LEFT JOIN assignment_submission_attributes asa ON asa.attribute_id = asea.attribute_id
          WHERE ase.assignment_id IN (${assPlaceholders})
            AND ase.student_id = ?
          GROUP BY ase.entity_id
        `, [...assessmentIds, studentId]);

        submissions = subs;
      } catch (subErr) {
        console.log("assignment_submission_entity query error:", subErr.message);
        submissions = [];
      }
    }

    // Build submission map for quick lookup
    const submissionMap = {};
    submissions.forEach(sub => {
      submissionMap[sub.assignmentId] = sub;
    });

    // Organize assessments by course
    const courseAssessments = courses.map(course => {
      const courseAss = allAssessments.filter(a => Number(a.courseId) === Number(course.courseId));

      return {
        courseId: course.courseId,
        code: course.code || '',
        title: course.title || 'Unknown Course',
        department: course.department || '',
        assessmentCount: courseAss.length,
        assessments: courseAss.map(a => {
          const submission = submissionMap[a.assessmentId];
          const hasSubmission = !!submission;
          const isGraded = submission?.grade !== null && submission?.grade !== undefined;
          const isSubmitted = hasSubmission && (
            submission.submissionStatus === 'submitted' ||
            submission.submissionStatus === 'graded' ||
            !submission.submissionStatus // If row exists, it means submitted
          );

          return {
            assessmentId: a.assessmentId,
            title: a.title,
            description: a.description || '',
            dueDate: a.dueDate || '',
            totalMarks: a.totalMarks || null,
            type: a.type || 'assignment',
            createdAt: a.createdAt,
            submissionStatus: isGraded ? 'graded' : (isSubmitted ? 'submitted' : 'not_submitted'),
            isSubmitted: isSubmitted,
            isGraded: isGraded,
            grade: isGraded ? submission.grade : null,
            feedback: submission?.feedback || null
          };
        })
      };
    });

    // Filter out courses with no assessments if desired (keep all for now)
    // Sort by course code
    courseAssessments.sort((a, b) => (a.code || '').localeCompare(b.code || ''));

    // Calculate summary stats
    const totalAssessments = allAssessments.length;
    const submittedCount = Object.keys(submissionMap).length;
    const gradedCount = Object.values(submissionMap).filter(s => s.grade !== null && s.grade !== undefined).length;

    return res.status(200).json({
      status: "success",
      data: courseAssessments,
      summary: {
        totalCourses: courseAssessments.length,
        totalAssessments,
        submittedCount,
        gradedCount,
        pendingCount: totalAssessments - submittedCount
      }
    });

  } catch (error) {
    console.error("getMyAssessmentsByCourse error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  getStudentProfile,
  viewCourses,
  enrollCourse,
  viewEnrolled,
  dropCourse,
  viewCourseAssignments,
  getMyMeetingRequests,
  createMeetingRequestForStaff,
  getStaffOfficeHours,
  getCourseInstructors,
  getCompletedCoursesWithGrades,
  updateEnrollmentWithFinalGrade,
  getEnrolledCourseMaterials,
  getMyAssessmentsByCourse
};
