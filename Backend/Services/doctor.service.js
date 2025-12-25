// services/doctorService.js
const ClassroomValue = require("../EAV models/classroom_value");
const ClassroomAttribute = require("../EAV models/classroom_attribute");
const ClassroomEntity = require("../EAV models/classroom_entity");
const EnrollmentAttribute = require("../EAV models/enrollment_attribute");
const staffEntity = require("../EAV models/staff_entity");

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

const ensureCourseAssessmentAttrs = async () => {
  const needed = [
    ["title", "string"],
    ["description", "string"],
    ["dueDate", "string"],
    ["totalMarks", "number"],
    ["status", "string"],
    ["type", "string"],         // ✅ NEW
  ];

  for (const [attrName, attrType] of needed) {
    const [[row]] = await pool.query(
      "SELECT attribute_id FROM course_assignment_attributes WHERE attribute_name=? LIMIT 1",
      [attrName]
    );
    if (!row?.attribute_id) {
      await pool.query(
        "INSERT INTO course_assignment_attributes (attribute_name, attribute_type) VALUES (?, ?)",
        [attrName, attrType]
      );
    }
  }
};

const getGlobalAttrId = async (attributeName) => {
  const [[row]] = await pool.query(
    "SELECT attribute_id FROM attributes WHERE attribute_name=? LIMIT 1",
    [attributeName]
  );
  return row?.attribute_id || null;
};

// helper: get staff attribute id
const getStaffAttrId = async (attributeName) => {
  const [[row]] = await pool.query(
    "SELECT attribute_id FROM staff_attributes WHERE attribute_name=? LIMIT 1",
    [attributeName]
  );
  return row?.attribute_id || null;
};

const getStaffIdFromUserEntityId = async (userEntityId) => {
  const entityId = Number(userEntityId);
  if (!Number.isFinite(entityId)) return null;

  const emailAttrId = await getGlobalAttrId("email");
  if (!emailAttrId) return null;

  const [[emailRow]] = await pool.query(
    `SELECT value_string AS email
     FROM entity_attribute
     WHERE entity_id=? AND attribute_id=? LIMIT 1`,
    [entityId, emailAttrId]
  );

  const rawEmail = String(emailRow?.email || "").trim().toLowerCase();
  if (!rawEmail) return null;

  const staffEmail = rawEmail.startsWith("staff-") ? rawEmail : `staff-${rawEmail}`;

  const [[staff]] = await pool.query(
    `SELECT entity_id
     FROM staff_entity
     WHERE LOWER(TRIM(entity_name)) = ?
        OR LOWER(TRIM(entity_name)) = ?
     LIMIT 1`,
    [rawEmail, staffEmail]
  );

  return staff?.entity_id || null;
};

// helper: upsert staff value (value_string)
const upsertStaffValue = async (staffId, attrId, valueString) => {
  if (!attrId) return;

  const [[existing]] = await pool.query(
    `SELECT value_id FROM staff_entity_attribute
     WHERE entity_id=? AND attribute_id=? LIMIT 1`,
    [staffId, attrId]
  );

  if (existing?.value_id) {
    await pool.query(
      `UPDATE staff_entity_attribute
       SET value_string=?
       WHERE value_id=?`,
      [valueString, existing.value_id]
    );
  } else {
    await pool.query(
      `INSERT INTO staff_entity_attribute (entity_id, attribute_id, value_string)
       VALUES (?, ?, ?)`,
      [staffId, attrId, valueString]
    );
  }
};

const getStudentNameByEntityId = async (studentEntityId) => {
  const id = Number(studentEntityId);
  if (!Number.isFinite(id)) return null;

  // try username/name
  const [[nameAttr]] = await pool.query(
    `SELECT attribute_id
     FROM attributes
     WHERE attribute_name IN ('username','name')
     ORDER BY (attribute_name='username') DESC
     LIMIT 1`
  );

  if (!nameAttr?.attribute_id) return null;

  const [[nameRow]] = await pool.query(
    `SELECT value_string AS name
     FROM entity_attribute
     WHERE entity_id=? AND attribute_id=? LIMIT 1`,
    [id, nameAttr.attribute_id]
  );

  return nameRow?.name || null;
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

      const rawEmail = String(emailRow.email || "").trim().toLowerCase();
      console.log(`[getDoctorCourses] Doctor ${entityId} email: ${rawEmail}`);

      // 3️⃣ Map email → staff_entity
      const staffEmail = rawEmail.startsWith("staff-") ? rawEmail : `staff-${rawEmail}`;

      let [[staff]] = await pool.query(
        `
      SELECT entity_id
      FROM staff_entity
      WHERE LOWER(TRIM(entity_name)) = ?
        OR LOWER(TRIM(entity_name)) = ?
      LIMIT 1
      `,
        [rawEmail, staffEmail]
      );

      // If staff_entity doesn't exist, create it automatically
      if (!staff) {
        console.warn(`[getDoctorCourses] No staff_entity found for ${rawEmail}, attempting to create one...`);
        try {
          const newStaffId = await staffEntity.create('doctor', staffEmail);
          console.log(`[getDoctorCourses] Auto-created staff_entity ${newStaffId} for doctor ${entityId}`);
          staff = { entity_id: newStaffId };
        } catch (createError) {
          console.error(`[getDoctorCourses] Failed to auto-create staff_entity:`, createError.message);
          
          // Log available staff entities for debugging
          const [allStaff] = await pool.query(
            `SELECT entity_id, entity_name FROM staff_entity LIMIT 5`
          );
          console.warn(`[getDoctorCourses] Available staff entities (sample):`, allStaff);
          
          return {
            success: false,
            message: `Doctor is not registered as staff. Please contact your administrator to set up your staff account. (Email: ${rawEmail})`,
            code: "STAFF_NOT_SETUP"
          };
        }
      }

      const staffId = staff.entity_id;
      console.log(`[getDoctorCourses] Using staff_id ${staffId} for doctor ${entityId}`);

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

      console.log(`[getDoctorCourses] Found ${rows.length} courses for doctor ${entityId}`);
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

    await ensureCourseAssessmentAttrs(); 

    
    const title = payload?.title;
    const description = payload?.description;
    const dueDate = payload?.dueDate || payload?.deadline; 
    const totalMarks =
      payload?.totalMarks ?? payload?.totalPoints; 
    const type = payload?.type || "assignment";

    if (!title || !dueDate) {
      return { success: false, message: "title and dueDate/deadline are required" };
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

    // create assessment entity (still using your table)
    const [ins] = await pool.query(
      `INSERT INTO course_assignment_entity (course_id, doctor_staff_id)
       VALUES (?, ?)`,
      [cId, staffId]
    );
    const assignmentId = ins.insertId;

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
    const typeAttrId = await getAttrId("type"); // ✅ NEW

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
    if (totalMarks !== undefined && totalMarks !== null) {
      await put(marksAttrId, { n: Number(totalMarks) });
    }
    await put(statusAttrId, { s: "active" });
    await put(typeAttrId, { s: String(type) });

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
      const attachmentsAttrId = await getAttrId("attachments");
      const typeAttrId = await getAttrId("type");

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
        vAtt.value_string AS attachments,
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
      LEFT JOIN course_assignment_entity_attribute vStatus
        ON vStatus.entity_id = cae.entity_id AND vStatus.attribute_id = ?
      LEFT JOIN course_assignment_entity_attribute vAtt
        ON vAtt.entity_id = cae.entity_id AND vAtt.attribute_id = ?
      LEFT JOIN course_assignment_entity_attribute vType
        ON vType.entity_id = cae.entity_id AND vType.attribute_id = ?

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
          attachmentsAttrId || -1,
           typeAttrId || -1,
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

    const { title, description, dueDate, totalMarks, type, status } = payload || {};

    if (
      title === undefined &&
      description === undefined &&
      dueDate === undefined &&
      totalMarks === undefined &&
      type === undefined &&
      status === undefined
    ) {
      return { success: false, message: "No fields to update" };
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
    const typeAttrId = await getAttrId("type");       // ✅ NEW
    const statusAttrId = await getAttrId("status");   // ✅ optional (publish/draft/active/closed)
    const updatedAtAttrId = await getAttrId("updatedAt");

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

    if (title !== undefined) await upsert(titleAttrId, { s: title ? String(title) : "" , n: null});
    if (description !== undefined) await upsert(descAttrId, { s: description ? String(description) : "", n: null });
    if (dueDate !== undefined) await upsert(dueAttrId, { s: dueDate ? String(dueDate) : "", n: null });
    if (totalMarks !== undefined) await upsert(marksAttrId, { s: null, n: Number(totalMarks) });

    // ✅ NEW: type (assignment/quiz/exam/project)
    if (type !== undefined) await upsert(typeAttrId, { s: String(type), n: null });

    // ✅ optional: status (draft/published/active/closed...)
    if (status !== undefined) await upsert(statusAttrId, { s: String(status), n: null });

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

  // ===================== Course Resources =====================
  getCourseResources: async (courseId) => {
    try {
      if (!courseId) {
        return { success: false, message: "courseId is required" };
      }

      const cId = Number(courseId);
      if (!Number.isFinite(cId)) {
        return { success: false, message: "Invalid courseId format" };
      }

      console.log(`[getCourseResources] Querying for course_id = ${cId}`);

      // Verify course exists
      const [[courseExists]] = await pool.query(
        `SELECT entity_id FROM course_entity WHERE entity_id = ? LIMIT 1`,
        [cId]
      );

      if (!courseExists) {
        console.error(`[getCourseResources] Course ${cId} does not exist`);
        return { success: false, message: `Course with ID ${cId} does not exist` };
      }

      const [resources] = await pool.query(
        `SELECT resource_id, title, description, file_name, file_path, file_type, file_size, upload_date
         FROM course_resources
         WHERE course_id = ? AND is_active = TRUE
         ORDER BY upload_date DESC`,
        [cId]
      );

      console.log(`[getCourseResources] Retrieved ${resources ? resources.length : 0} resources for course ${cId}`);

      return { success: true, data: resources || [] };
    } catch (e) {
      console.error("getCourseResources error:", e.message);
      return { success: false, message: `Database error: ${e.message}` };
    }
  },

  uploadCourseResource: async (courseId, doctorId, resourceData) => {
    try {
      const { title, fileName, filePath, fileType, fileSize, description } = resourceData;

      if (!title) {
        return { success: false, message: "Resource title is required" };
      }

      const cId = Number(courseId);
      const dId = Number(doctorId);

      if (!Number.isFinite(cId) || !Number.isFinite(dId)) {
        return { success: false, message: "Invalid courseId or doctorId format" };
      }

      console.log(`[uploadCourseResource] Uploading: title=${title}, course=${cId}, doctor=${dId}`);

      // Verify course exists
      const [[courseExists]] = await pool.query(
        `SELECT entity_id FROM course_entity WHERE entity_id = ? LIMIT 1`,
        [cId]
      );

      if (!courseExists) {
        console.error(`[uploadCourseResource] Course ${cId} does not exist`);
        return { success: false, message: `Course with ID ${cId} does not exist` };
      }

      const [result] = await pool.query(
        `INSERT INTO course_resources 
         (course_id, doctor_id, title, description, file_name, file_path, file_type, file_size, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [cId, dId, title, description || null, fileName, filePath, fileType, fileSize || 0]
      );

      const [resource] = await pool.query(
        `SELECT resource_id, title, description, file_name, file_path, file_type, file_size, upload_date
         FROM course_resources
         WHERE resource_id = ?`,
        [result.insertId]
      );

      console.log(`[uploadCourseResource] Resource created with ID: ${result.insertId}`);

      return { success: true, data: resource[0] };
    } catch (e) {
      console.error("uploadCourseResource error:", e.message);
      return { success: false, message: `Database error: ${e.message}` };
    }
  },

  // ===================== Course Staff (TAs) =====================
  getCourseStaff: async (courseId) => {
    try {
      if (!courseId) {
        return { success: false, message: "courseId is required" };
      }

      // Get assignments from assignment_entity (where admin stores course staff assignments)
      const [assignments] = await pool.query(
        `SELECT ae.entity_id, ae.staff_id, ae.created_at
         FROM assignment_entity ae
         WHERE ae.course_id = ? AND ae.staff_id IS NOT NULL
         ORDER BY ae.created_at DESC`,
        [courseId]
      );

      if (!assignments || assignments.length === 0) {
        console.log(`[getCourseStaff] No assignments found for course ${courseId}`);
        return { success: true, data: [] };
      }

      console.log(`[getCourseStaff] Found ${assignments.length} assignments for course ${courseId}`);

      // Get staff details from EAV model for each assigned staff
      const data = [];
      for (const assignment of assignments) {
        try {
          const staffId = assignment.staff_id;
          const assignmentId = assignment.entity_id;

          // Get name attribute
          const [nameAttr] = await pool.query(
            `SELECT value_string FROM staff_entity_attribute 
             WHERE entity_id = ? AND attribute_id = (
               SELECT attribute_id FROM staff_attributes WHERE attribute_name = 'name' LIMIT 1
             ) LIMIT 1`,
            [staffId]
          );

          // Get email attribute
          const [emailAttr] = await pool.query(
            `SELECT value_string FROM staff_entity_attribute 
             WHERE entity_id = ? AND attribute_id = (
               SELECT attribute_id FROM staff_attributes WHERE attribute_name = 'email' LIMIT 1
             ) LIMIT 1`,
            [staffId]
          );

          // Get role from assignment attributes
          const [roleAttr] = await pool.query(
            `SELECT value_string FROM assignment_entity_attribute 
             WHERE entity_id = ? AND attribute_id = (
               SELECT attribute_id FROM assignment_attributes WHERE attribute_name = 'role' LIMIT 1
             ) LIMIT 1`,
            [assignmentId]
          );

          data.push({
            assignmentId: assignmentId,
            staffId: staffId,
            role: roleAttr[0]?.value_string || "Teaching Assistant",
            assignedDate: assignment.created_at,
            name: nameAttr[0]?.value_string || "Unknown",
            email: emailAttr[0]?.value_string || "",
          });
        } catch (e) {
          console.error(`Error fetching details for staff ${assignment.staff_id}:`, e.message);
          // Still add the assignment even if details fail
          data.push({
            assignmentId: assignment.entity_id,
            staffId: assignment.staff_id,
            role: "Teaching Assistant",
            assignedDate: assignment.created_at,
            name: "Unknown",
            email: "",
          });
        }
      }

      console.log(`[getCourseStaff] Retrieved ${data.length} staff for course ${courseId}`);
      return { success: true, data };
    } catch (e) {
      console.error("getCourseStaff error:", e.message);
      return { success: false, message: `Database error: ${e.message}` };
    }
  },

  // ===================== Course Schedule =====================
  getCourseSchedule: async (courseId, doctorId) => {
    try {
      if (!courseId || !doctorId) {
        return { success: false, message: "courseId and doctorId are required" };
      }

      const [schedule] = await pool.query(
        `SELECT schedule_id, day_of_week, start_time, end_time, room_name, classroom_id, semester
         FROM course_schedule
         WHERE course_id = ? AND doctor_id = ? AND is_active = TRUE
         ORDER BY 
           CASE WHEN day_of_week = 'Monday' THEN 1
                WHEN day_of_week = 'Tuesday' THEN 2
                WHEN day_of_week = 'Wednesday' THEN 3
                WHEN day_of_week = 'Thursday' THEN 4
                WHEN day_of_week = 'Friday' THEN 5
                WHEN day_of_week = 'Saturday' THEN 6
                WHEN day_of_week = 'Sunday' THEN 7
                ELSE 8 END,
           start_time`,
        [courseId, doctorId]
      );

      const data = schedule.map((s) => ({
        scheduleId: s.schedule_id,
        day: s.day_of_week,
        startTime: s.start_time,
        endTime: s.end_time,
        room: s.room_name || "TBD",
        classroomId: s.classroom_id,
        semester: s.semester,
      }));

      console.log(`Retrieved ${data.length} schedule slots for course ${courseId}, doctor ${doctorId}`);

      return { success: true, data };
    } catch (e) {
      console.error("getCourseSchedule error:", e.message);
      return { success: false, message: `Database error: ${e.message}` };
    }
  },
  getDoctorByEmail: async (email) => {
  try {
    if (!email) return { success: false, message: "email is required" };

    const rawEmail = String(email).trim().toLowerCase();
    const staffEmail = rawEmail.startsWith("staff-") ? rawEmail : `staff-${rawEmail}`;

    // 1) find staff entity
    const [[staff]] = await pool.query(
      `
      SELECT entity_id, entity_type, entity_name
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
        message: `Doctor not found in staff_entity (searched: ${rawEmail} / ${staffEmail})`,
      };
    }

    const staffId = staff.entity_id;

    // 2) pivot staff EAV attributes
    const [rows] = await pool.query(
      `
      SELECT
        se.entity_id AS staffId,
        se.entity_type AS entityType,
        se.entity_name AS entityName,

        MAX(CASE WHEN sa.attribute_name='name' THEN sea.value_string END) AS name,
        MAX(CASE WHEN sa.attribute_name='email' THEN sea.value_string END) AS email,
        MAX(CASE WHEN sa.attribute_name='phone' THEN sea.value_string END) AS phone,
        MAX(CASE WHEN sa.attribute_name='officeLocation' THEN sea.value_string END) AS officeLocation,
        MAX(CASE WHEN sa.attribute_name='specialization' THEN sea.value_string END) AS specialization,
        MAX(CASE WHEN sa.attribute_name='bio' THEN sea.value_string END) AS bio,
        MAX(CASE WHEN sa.attribute_name='role' THEN sea.value_string END) AS role,
        MAX(CASE WHEN sa.attribute_name='department' THEN sea.value_string END) AS department,
        MAX(CASE WHEN sa.attribute_name='status' THEN sea.value_string END) AS status,
        MAX(CASE WHEN sa.attribute_name='hireDate' THEN sea.value_string END) AS hireDate,
        MAX(CASE WHEN sa.attribute_name='roles' THEN sea.value_string END) AS rolesJson

      FROM staff_entity se
      LEFT JOIN staff_entity_attribute sea ON sea.entity_id = se.entity_id
      LEFT JOIN staff_attributes sa ON sa.attribute_id = sea.attribute_id
      WHERE se.entity_id = ?
      GROUP BY se.entity_id
      LIMIT 1
      `,
      [staffId]
    );

    const doc = rows?.[0];
    if (!doc) return { success: false, message: "Staff attributes not found" };

    let roles = [];
    try { roles = doc.rolesJson ? JSON.parse(doc.rolesJson) : []; } catch {}

    return {
      success: true,
      data: {
        staffId: doc.staffId,
        entityType: doc.entityType,
        entityName: doc.entityName,
        name: doc.name || null,
        email: doc.email || rawEmail,
        phone: doc.phone || null,
        officeLocation: doc.officeLocation || null,
        specialization: doc.specialization || null,
        bio: doc.bio || null,
        role: doc.role || staff.entity_type || null,
        department: doc.department || null,
        status: doc.status || null,
        hireDate: doc.hireDate || null,
        roles,
      },
    };
  } catch (e) {
    console.error("getDoctorByEmail error:", e);
    return { success: false, message: e.message };
  }
},
updateMyDoctorProfile: async (userEntityId, payload) => {
  try {
    const entityId = Number(userEntityId);
    if (!Number.isFinite(entityId)) {
      return { success: false, message: "Invalid user entity id" };
    }

    // 1) get email from entities EAV
    const emailAttrId = await getGlobalAttrId("email");
    if (!emailAttrId) {
      return { success: false, message: "Global email attribute not found" };
    }

    const [[emailRow]] = await pool.query(
      `SELECT value_string AS email
       FROM entity_attribute
       WHERE entity_id=? AND attribute_id=? LIMIT 1`,
      [entityId, emailAttrId]
    );

    const rawEmail = String(emailRow?.email || "").trim().toLowerCase();
    if (!rawEmail) return { success: false, message: "Email not found for current user" };

    // 2) map email -> staff_entity
    const staffEmail = rawEmail.startsWith("staff-") ? rawEmail : `staff-${rawEmail}`;

    const [[staff]] = await pool.query(
      `SELECT entity_id
       FROM staff_entity
       WHERE LOWER(TRIM(entity_name)) = ?
          OR LOWER(TRIM(entity_name)) = ?
       LIMIT 1`,
      [rawEmail, staffEmail]
    );

    if (!staff) {
      return { success: false, message: "Doctor is not registered as staff" };
    }

    const staffId = staff.entity_id;

    // 3) upsert editable staff attributes
    const editable = [
      ["name", payload?.name],
      ["phone", payload?.phone],
      ["officePhone", payload?.officePhone],
      ["officeLocation", payload?.officeLocation],
      ["bio", payload?.bio],
      ["specialization", payload?.specialization],
    ];

    for (const [attrName, value] of editable) {
      if (value === undefined || value === null) continue;
      const attrId = await getStaffAttrId(attrName);
      await upsertStaffValue(staffId, attrId, String(value));
    }

    // 4) return updated profile
    const after = await doctorService.getDoctorByEmail(rawEmail);
    if (!after.success) {
      return { success: true, message: "Profile updated", data: { staffId } };
    }

    return { success: true, message: "Profile updated", data: after.data };
  } catch (e) {
    console.error("updateMyDoctorProfile service error:", e);
    return { success: false, message: e.message };
  }
},

 getMyOfficeHours: async (doctorEntityId) => {
    try {
      const staffId = await getStaffIdFromUserEntityId(doctorEntityId);
      if (!staffId) return { success: false, message: "Doctor staff mapping not found" };

      const [rows] = await pool.query(
        `SELECT id, day, start_time, end_time, location
         FROM doctor_office_hours
         WHERE doctor_staff_id=? AND is_active=1
         ORDER BY FIELD(day,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'), start_time`,
        [staffId]
      );

      const data = rows.map((r) => ({
        id: r.id,
        day: r.day,
        startTime: r.start_time,
        endTime: r.end_time,
        location: r.location,
      }));

      return { success: true, data };
    } catch (e) {
      console.error("getMyOfficeHours error:", e);
      return { success: false, message: e.message };
    }
  },

  createOfficeHour: async (doctorEntityId, payload) => {
    try {
      const staffId = await getStaffIdFromUserEntityId(doctorEntityId);
      if (!staffId) return { success: false, message: "Doctor staff mapping not found" };

      const { day, startTime, endTime, location } = payload || {};
      if (!day || !startTime || !endTime || !location) {
        return { success: false, message: "day, startTime, endTime, location are required" };
      }

      await pool.query(
        `INSERT INTO doctor_office_hours (doctor_staff_id, day, start_time, end_time, location)
         VALUES (?, ?, ?, ?, ?)`,
        [staffId, String(day), String(startTime), String(endTime), String(location)]
      );

      // return refreshed list
      return await doctorService.getMyOfficeHours(doctorEntityId);
    } catch (e) {
      console.error("createOfficeHour error:", e);
      return { success: false, message: e.message };
    }
  },

  // ===================== Meeting Requests =====================
  getMeetingRequests: async (doctorEntityId) => {
    try {
      const staffId = await getStaffIdFromUserEntityId(doctorEntityId);
      if (!staffId) return { success: false, message: "Doctor staff mapping not found" };

      const [rows] = await pool.query(
        `SELECT id, student_entity_id, student_name, reason, requested_date, requested_time, status
         FROM doctor_meeting_requests
         WHERE doctor_staff_id=?
         ORDER BY
           CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
           created_at DESC`,
        [staffId]
      );

      const data = rows.map((r) => ({
        id: r.id,
        studentName: r.student_name || "Student",
        reason: r.reason || "",
        requestedDate: r.requested_date,
        requestedTime: r.requested_time,
        status: r.status,
      }));

      return { success: true, data };
    } catch (e) {
      console.error("getMeetingRequests error:", e);
      return { success: false, message: e.message };
    }
  },
  updateMeetingRequestStatus: async (requestId, status) => {
  try {
    await pool.query(
      `UPDATE doctor_meeting_requests
       SET status = ?
       WHERE id = ?`,
      [status, requestId]
    );

    return { success: true };
  } catch (e) {
    console.error("updateMeetingRequestStatus error:", e);
    return { success: false, message: e.message };
  }
},


};

module.exports = doctorService;
