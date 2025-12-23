// services/doctorService.js
const ClassroomValue = require("../EAV models/classroom_value");
const ClassroomAttribute = require("../EAV models/classroom_attribute");
const ClassroomEntity = require("../EAV models/classroom_entity");
const EnrollmentAttribute = require("../EAV models/enrollment_attribute");

const pool = require("../Db_config/DB");

let attributesInitialized = false;

const initializeAttributes = async () => {
  if (attributesInitialized) return;
  try {
    await ClassroomAttribute.createClassroomAttribute("isworking", "string");
    await ClassroomAttribute.createClassroomAttribute("timeslot", "string");
    await ClassroomAttribute.createClassroomAttribute("classroom_requests", "string");

    attributesInitialized = true;
    console.log("Classroom attributes initialized");
  } catch (error) {
    console.error("Error initializing classroom attributes:", error.message);
  }
};

// ---------- Course helpers (EAV) ----------
const getCourseAttrIdByName = async (attributeName) => {
  const [[row]] = await pool.query(
    "SELECT attribute_id FROM course_attributes WHERE attribute_name=? LIMIT 1",
    [attributeName]
  );
  return row?.attribute_id || null;
};

const getEnrAttrId = async (name) => {
  const a = await EnrollmentAttribute.getAttributeByName(name);
  return a?.attribute_id || null;
};

// ---------- Assignment helpers ----------
const getAssignmentAttrIdByName = async (name) => {
  const [[row]] = await pool.query(
    "SELECT attribute_id FROM assignment_attributes WHERE attribute_name=? LIMIT 1",
    [name]
  );
  return row?.attribute_id || null;
};

const ensureAssignmentAttrs = async () => {
  // create missing attributes safely (only if your assignment_attributes uses attribute_type not data_type)
  // If your table column is "data_type", change attribute_type -> data_type in the INSERTs below.
  const needed = [
    ["title", "string"],
    ["description", "string"],
    ["dueDate", "string"],      // store ISO string
    ["totalMarks", "number"],
    ["status", "string"],       // active/closed...
  ];

  for (const [attrName, attrType] of needed) {
    const id = await getAssignmentAttrIdByName(attrName);
    if (!id) {
      await pool.query(
        "INSERT INTO assignment_attributes (attribute_name, attribute_type) VALUES (?, ?)",
        [attrName, attrType]
      );
    }
  }
};


const doctorService = {
  // ===================== Classroom Booking =====================
  bookClassroomRequest: async (classroomId, slotId, doctorId) => {
    try {
      await initializeAttributes();

      const timeslotAttr = await ClassroomAttribute.getAttributeByName("timeslot");
      const requestAttr = await ClassroomAttribute.getAttributeByName("classroom_requests");

      const [slots] = await pool.query(
        "SELECT * FROM classroom_entity_attribute WHERE value_id = ? AND entity_id = ? AND attribute_id = ?",
        [slotId, classroomId, timeslotAttr.attribute_id]
      );

      if (!slots || slots.length === 0) {
        return { success: false, message: "Timeslot not found" };
      }

      const slot = slots[0];

      // NOTE: your timeslot attribute seems to use value_number as "booked flag"
      if (slot.value_number === 1) {
        return { success: false, message: "This timeslot is already booked" };
      }

      const [existingRequest] = await pool.query(
        `SELECT * FROM classroom_entity_attribute 
         WHERE entity_id = ? AND attribute_id = ? 
         AND value_string LIKE ? AND value_string LIKE ?`,
        [classroomId, requestAttr.attribute_id, `%${doctorId}%`, `%${slotId}%`]
      );

      if (existingRequest.length > 0) {
        return { success: false, message: "A request for this slot is already pending" };
      }

      const requestData = {
        doctorId: doctorId,
        requestedSlotId: slotId,
        status: "pending",
        requestedAt: new Date().toISOString(),
      };

      await ClassroomValue.createClassroomValue(classroomId, requestAttr.attribute_id, {
        value_string: JSON.stringify(requestData),
        value_number: 0, // 0 for pending status of the request itself
        value_reference: null,
      });

      return { success: true, message: "Booking request sent to admin for approval" };
    } catch (error) {
      console.error("Error in bookClassroomRequest:", error);
      return { success: false, message: "Internal server error: " + error.message };
    }
  },

  getDoctorByEmail: async (email) => {
    const [rows] = await pool.query(
      "SELECT id, email FROM users WHERE email = ? AND role = 'doctor'",
      [email]
    );
    return rows[0];
  },

  // ===================== Doctor Courses (Course EAV) =====================
  getDoctorCourses: async (doctorEntityId) => {
    try {
      const entityId = Number(doctorEntityId);
      if (!Number.isFinite(entityId)) {
        return { success: false, message: "Invalid doctor id" };
      }

      // 1️⃣ Get email attribute id
      const [[emailAttr]] = await pool.query(
        "SELECT attribute_id FROM attributes WHERE attribute_name='email' LIMIT 1"
      );
      if (!emailAttr) {
        return { success: false, message: "Email attribute not found" };
      }

      // 2️⃣ Get doctor's email from entity EAV
      const [[emailRow]] = await pool.query(
        `
      SELECT value_string AS email
      FROM entity_attribute
      WHERE entity_id=? AND attribute_id=? LIMIT 1
      `,
        [entityId, emailAttr.attribute_id]
      );

      if (!emailRow?.email) {
        return { success: false, message: "Doctor email not found in entity attributes" };
      }

      // 3️⃣ Map email → staff_entity
      const rawEmail = String(emailRow.email || "").trim().toLowerCase();
      const staffEmail = rawEmail.startsWith("staff-") ? rawEmail : `staff-${rawEmail}`;

      const [[staff]] = await pool.query(
        `
      SELECT entity_id
      FROM staff_entity
      WHERE LOWER(TRIM(entity_name)) = ?
        OR LOWER(TRIM(entity_name)) = ?
      LIMIT 1
      `,
        [rawEmail, staffEmail]
      );

      if (!staff) {
        return {
          success: false,
          message: `Doctor is not registered as staff (searched: ${rawEmail} / ${staffEmail})`,
        };
      }


      const staffId = staff.entity_id;

      // 4️⃣ Fetch assigned courses
      const [rows] = await pool.query(
        `
      SELECT
        ce.entity_id AS id,

        MAX(CASE WHEN ca.attribute_name='title' THEN cea.value_string END) AS title,
        MAX(CASE WHEN ca.attribute_name='code' THEN cea.value_string END) AS code,
        MAX(CASE WHEN ca.attribute_name='description' THEN cea.value_string END) AS description,
        MAX(CASE WHEN ca.attribute_name='department' THEN cea.value_string END) AS department,
        MAX(CASE WHEN ca.attribute_name='credits' THEN cea.value_number END) AS credits

      FROM assignment_entity ae
      JOIN course_entity ce ON ce.entity_id = ae.course_id
      LEFT JOIN course_entity_attribute cea ON cea.entity_id = ce.entity_id
      LEFT JOIN course_attributes ca ON ca.attribute_id = cea.attribute_id
      WHERE ae.staff_id = ?
      GROUP BY ce.entity_id
      ORDER BY MAX(ae.created_at) DESC
      `,
        [staffId]
      );

      return { success: true, data: rows };
    } catch (error) {
      console.error("getDoctorCourses error:", error);
      return { success: false, message: error.message };
    }
  },
  // ===================== Create Course Assignment (Doctor) =====================
  // doctorEntityId comes from login (entities.id)
  // courseId is course_entity.id
  createCourseAssignment: async (doctorEntityId, courseId, payload) => {
    try {
      const entityId = Number(doctorEntityId);
      const cId = Number(courseId);
      if (!Number.isFinite(entityId) || !Number.isFinite(cId)) {
        return { success: false, message: "Invalid doctorId or courseId" };
      }

      const { title, description, dueDate, totalMarks } = payload || {};
      if (!title || !dueDate) {
        return { success: false, message: "title and dueDate are required" };
      }

      // resolve staffId (same logic)
      const [[emailAttr]] = await pool.query(
        "SELECT attribute_id FROM attributes WHERE attribute_name='email' LIMIT 1"
      );
      if (!emailAttr) return { success: false, message: "Email attribute not found" };

      const [[emailRow]] = await pool.query(
        `SELECT value_string AS email
       FROM entity_attribute
       WHERE entity_id=? AND attribute_id=? LIMIT 1`,
        [entityId, emailAttr.attribute_id]
      );
      if (!emailRow?.email) return { success: false, message: "Doctor email not found" };

      const rawEmail = String(emailRow.email || "").trim().toLowerCase();
      const staffEmail = rawEmail.startsWith("staff-") ? rawEmail : `staff-${rawEmail}`;

      const [[staff]] = await pool.query(
        `SELECT entity_id FROM staff_entity
       WHERE LOWER(TRIM(entity_name)) = ?
          OR LOWER(TRIM(entity_name)) = ?
       LIMIT 1`,
        [rawEmail, staffEmail]
      );
      if (!staff) return { success: false, message: "Doctor is not registered as staff" };

      const staffId = staff.entity_id;

      // ✅ create homework assignment in NEW table
      const [ins] = await pool.query(
        `INSERT INTO course_assignment_entity (course_id, doctor_staff_id)
       VALUES (?, ?)`,
        [cId, staffId]
      );
      const assignmentId = ins.insertId;

      // helper to get attr id
      const getAttrId = async (name) => {
        const [[row]] = await pool.query(
          "SELECT attribute_id FROM course_assignment_attributes WHERE attribute_name=? LIMIT 1",
          [name]
        );
        return row?.attribute_id || null;
      };

      const titleAttrId = await getAttrId("title");
      const descAttrId = await getAttrId("description");
      const dueAttrId = await getAttrId("dueDate");
      const marksAttrId = await getAttrId("totalMarks");
      const statusAttrId = await getAttrId("status");

      const put = async (attrId, { s = null, n = null, r = null }) => {
        if (!attrId) return;
        await pool.query(
          `INSERT INTO course_assignment_entity_attribute
         (entity_id, attribute_id, value_string, value_number, value_reference)
         VALUES (?, ?, ?, ?, ?)`,
          [assignmentId, attrId, s, n, r]
        );
      };

      await put(titleAttrId, { s: String(title) });
      if (description) await put(descAttrId, { s: String(description) });
      await put(dueAttrId, { s: String(dueDate) });
      if (totalMarks !== undefined && totalMarks !== null) await put(marksAttrId, { n: Number(totalMarks) });
      await put(statusAttrId, { s: "active" });

      return { success: true, data: { assignmentId } };
    } catch (e) {
      console.error("createCourseAssignment error:", e);
      return { success: false, message: e.message };
    }
  },

  // ===================== View Course Assignments (Student) =====================
  getCourseAssignmentsForStudents: async (courseId) => {
    try {
      const cId = Number(courseId);
      if (!Number.isFinite(cId)) {
        return { success: false, message: "Invalid courseId" };
      }

      const getAttrId = async (name) => {
        const [[row]] = await pool.query(
          "SELECT attribute_id FROM course_assignment_attributes WHERE attribute_name=? LIMIT 1",
          [name]
        );
        return row?.attribute_id || null;
      };

      const titleAttrId = await getAttrId("title");
      const descAttrId = await getAttrId("description");
      const dueAttrId = await getAttrId("dueDate");
      const marksAttrId = await getAttrId("totalMarks");
      const statusAttrId = await getAttrId("status");
      const attachmentsAttrId = await getAttrId("attachments"); // ✅ NEW

      const [rows] = await pool.query(
        `
      SELECT
        cae.entity_id AS assignmentId,
        cae.course_id AS courseId,
        cae.doctor_staff_id AS doctorStaffId,
        cae.created_at AS createdAt,

        vTitle.value_string AS title,
        vDesc.value_string AS description,
        vDue.value_string AS dueDate,
        vMarks.value_number AS totalMarks,
        vStatus.value_string AS status,
        vAtt.value_string AS attachments  -- ✅ NEW (JSON string)

      FROM course_assignment_entity cae

      LEFT JOIN course_assignment_entity_attribute vTitle
        ON vTitle.entity_id = cae.entity_id AND vTitle.attribute_id = ?
      LEFT JOIN course_assignment_entity_attribute vDesc
        ON vDesc.entity_id = cae.entity_id AND vDesc.attribute_id = ?
      LEFT JOIN course_assignment_entity_attribute vDue
        ON vDue.entity_id = cae.entity_id AND vDue.attribute_id = ?
      LEFT JOIN course_assignment_entity_attribute vMarks
        ON vMarks.entity_id = cae.entity_id AND vMarks.attribute_id = ?
      LEFT JOIN course_assignment_entity_attribute vStatus
        ON vStatus.entity_id = cae.entity_id AND vStatus.attribute_id = ?
      LEFT JOIN course_assignment_entity_attribute vAtt
        ON vAtt.entity_id = cae.entity_id AND vAtt.attribute_id = ?  -- ✅ NEW

      WHERE cae.course_id = ?
        AND (vStatus.value_string IS NULL OR vStatus.value_string='active')
        AND vTitle.value_string IS NOT NULL     -- ✅ avoids "Untitled Assignment"
        AND vDue.value_string IS NOT NULL       -- ✅ avoids "No due date"

      ORDER BY cae.created_at DESC;
      `,
        [
          titleAttrId || -1,
          descAttrId || -1,
          dueAttrId || -1,
          marksAttrId || -1,
          statusAttrId || -1,
          attachmentsAttrId || -1, // ✅ NEW
          cId,
        ]
      );

      return { success: true, data: rows };
    } catch (e) {
      console.error("getCourseAssignmentsForStudents error:", e);
      return { success: false, message: e.message };
    }
  },

  updateCourseAssignment: async (doctorEntityId, assignmentId, payload) => {
    try {
      const aId = Number(assignmentId);
      if (!Number.isFinite(aId)) return { success: false, message: "Invalid assignmentId" };

      const { title, description, dueDate, totalMarks } = payload || {};
      if (!title && !description && !dueDate && totalMarks === undefined) {
        return { success: false, message: "No fields to update" };
      }

      // helper: get attr id from course_assignment_attributes
      const getAttrId = async (name) => {
        const [[row]] = await pool.query(
          "SELECT attribute_id FROM course_assignment_attributes WHERE attribute_name=? LIMIT 1",
          [name]
        );
        return row?.attribute_id || null;
      };

      const titleAttrId = await getAttrId("title");
      const descAttrId = await getAttrId("description");
      const dueAttrId = await getAttrId("dueDate");
      const marksAttrId = await getAttrId("totalMarks");
      const updatedAtAttrId = await getAttrId("updatedAt");

      // helper: upsert value
      const upsert = async (attrId, { s = null, n = null }) => {
        if (!attrId) return;
        const [[existing]] = await pool.query(
          `SELECT value_id FROM course_assignment_entity_attribute
         WHERE entity_id=? AND attribute_id=? LIMIT 1`,
          [aId, attrId]
        );

        if (existing?.value_id) {
          await pool.query(
            `UPDATE course_assignment_entity_attribute
           SET value_string=?, value_number=?
           WHERE value_id=?`,
            [s, n, existing.value_id]
          );
        } else {
          await pool.query(
            `INSERT INTO course_assignment_entity_attribute
           (entity_id, attribute_id, value_string, value_number)
           VALUES (?, ?, ?, ?)`,
            [aId, attrId, s, n]
          );
        }
      };

      if (title !== undefined) await upsert(titleAttrId, { s: String(title), n: null });
      if (description !== undefined) await upsert(descAttrId, { s: String(description), n: null });
      if (dueDate !== undefined) await upsert(dueAttrId, { s: String(dueDate), n: null });
      if (totalMarks !== undefined) await upsert(marksAttrId, { s: null, n: Number(totalMarks) });

      await upsert(updatedAtAttrId, { s: new Date().toISOString(), n: null });

      return { success: true };
    } catch (e) {
      console.error("updateCourseAssignment error:", e);
      return { success: false, message: e.message };
    }
  },
  addAssignmentAttachment: async (assignmentId, attachment) => {
    try {
      const aId = Number(assignmentId);
      if (!Number.isFinite(aId)) return { success: false, message: "Invalid assignmentId" };

      const getAttrId = async (attr) => {
        const [[row]] = await pool.query(
          "SELECT attribute_id FROM course_assignment_attributes WHERE attribute_name=? LIMIT 1",
          [attr]
        );
        return row?.attribute_id || null;
      };

      const attachmentsAttrId = await getAttrId("attachments");
      if (!attachmentsAttrId) return { success: false, message: "attachments attribute missing" };

      const [[existing]] = await pool.query(
        `SELECT value_id, value_string
       FROM course_assignment_entity_attribute
       WHERE entity_id=? AND attribute_id=? LIMIT 1`,
        [aId, attachmentsAttrId]
      );

      const prev = existing?.value_string ? JSON.parse(existing.value_string) : [];

      prev.push({
        name: attachment.name || "attachment",
        url: attachment.url,               // "/uploads/assignments/..."
        filename: attachment.filename,
        originalname: attachment.originalname,
        mimetype: attachment.mimetype,
        size: attachment.size,
        uploadedAt: new Date().toISOString(),
      });

      const next = JSON.stringify(prev);

      if (existing?.value_id) {
        await pool.query(
          `UPDATE course_assignment_entity_attribute SET value_string=? WHERE value_id=?`,
          [next, existing.value_id]
        );
      } else {
        await pool.query(
          `INSERT INTO course_assignment_entity_attribute (entity_id, attribute_id, value_string)
         VALUES (?, ?, ?)`,
          [aId, attachmentsAttrId, next]
        );
      }

      return { success: true, data: prev };
    } catch (e) {
      console.error("addAssignmentAttachment error:", e);
      return { success: false, message: e.message };
    }
  },
  getCourseStudents: async (courseId) => {
    try {
      const cId = Number(courseId);
      if (!Number.isFinite(cId)) {
        return { success: false, message: "Invalid courseId" };
      }

      if (typeof initEnrollmentAttrs === "function") {
        await initEnrollmentAttrs();
      }

      // enrollment attr ids
      const studentAttr = await EnrollmentAttribute.getAttributeByName("studentId");
      const courseAttr = await EnrollmentAttribute.getAttributeByName("courseId");
      const statusAttr = await EnrollmentAttribute.getAttributeByName("status");
      const gradeAttr = await EnrollmentAttribute.getAttributeByName("grade");

      if (!studentAttr || !courseAttr) {
        return {
          success: false,
          message: "Enrollment attributes missing (studentId/courseId)",
        };
      }

      // general user attrs (user_entity_attribute uses global `attributes` table)
      const [[emailAttr]] = await pool.query(
        "SELECT attribute_id FROM attributes WHERE attribute_name='email' LIMIT 1"
      );
      const [[nameAttr]] = await pool.query(
        `
      SELECT attribute_id
      FROM attributes
      WHERE attribute_name IN ('username','name')
      ORDER BY (attribute_name='username') DESC
      LIMIT 1
      `
      );

      const emailAttrId = emailAttr?.attribute_id ?? -1;
      const nameAttrId = nameAttr?.attribute_id ?? -1;

      const [rows] = await pool.query(
        `
      SELECT
        ee.entity_id AS enrollmentId,

        -- student/course ids are stored in value_number in your DB
        CAST(vStudent.value_number AS UNSIGNED) AS studentId,
        CAST(vCourse.value_number  AS UNSIGNED) AS courseId,

        vStatus.value_string AS status,
        vGrade.value_number  AS grade,

        ue.entity_id AS userEntityId,
        ue.entity_name AS userEntityName,

        uName.value_string  AS name,
        uEmail.value_string AS email

      FROM enrollment_entity ee

      JOIN enrollment_entity_attribute vCourse
        ON vCourse.entity_id = ee.entity_id
       AND vCourse.attribute_id = ?
       AND CAST(vCourse.value_number AS UNSIGNED) = ?

      JOIN enrollment_entity_attribute vStudent
        ON vStudent.entity_id = ee.entity_id
       AND vStudent.attribute_id = ?

      LEFT JOIN enrollment_entity_attribute vStatus
        ON vStatus.entity_id = ee.entity_id
       AND vStatus.attribute_id = ?

      LEFT JOIN enrollment_entity_attribute vGrade
        ON vGrade.entity_id = ee.entity_id
       AND vGrade.attribute_id = ?

      -- student user
      LEFT JOIN entities ue
        ON ue.entity_id = CAST(vStudent.value_number AS UNSIGNED)

      LEFT JOIN entity_attribute uName
        ON uName.entity_id = ue.entity_id
       AND uName.attribute_id = ?

      LEFT JOIN entity_attribute uEmail
        ON uEmail.entity_id = ue.entity_id
       AND uEmail.attribute_id = ?

      -- keep only non-rejected (case-insensitive)
      WHERE (vStatus.value_string IS NULL OR UPPER(TRIM(vStatus.value_string)) <> 'REJECTED')

      ORDER BY ee.entity_id DESC;
      `,
        [
          courseAttr.attribute_id,
          cId,
          studentAttr.attribute_id,
          statusAttr?.attribute_id ?? -1,
          gradeAttr?.attribute_id ?? -1,
          nameAttrId,
          emailAttrId,
        ]
      );

      const data = (rows || []).map((r) => ({
        enrollmentId: r.enrollmentId,
        id: r.studentId, // studentId
        name: r.name || r.userEntityName || "Unknown",
        email: r.email || "",
        status: r.status || "APPROVED",
        grade: r.grade ?? null,
      }));

      return { success: true, data };
    } catch (e) {
      console.error("getCourseStudents error:", e);
      return { success: false, message: e.message };
    }
  },





};

module.exports = doctorService;
