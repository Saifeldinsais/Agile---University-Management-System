// services/doctorService.js
const ClassroomValue = require("../EAV models/classroom_value");
const ClassroomAttribute = require("../EAV models/classroom_attribute");
const ClassroomEntity = require("../EAV models/classroom_entity");
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
  // Returns courses assigned to this doctor (by an EAV attribute on course_entity_attribute)
  // Expected attribute name: doctorId OR instructorId OR assignedDoctorId
  getDoctorCourses: async (doctorId) => {
    try {
      const doctorAttrId = await getCourseAttrIdByName("instructor_id");

      if (!doctorAttrId) {
        return {
          success: false,
          message: "Course attribute instructor_id not found",
        };
      }

      const [rows] = await pool.query(
        `
        SELECT
          ce.entity_id AS courseId,

          MAX(CASE WHEN ca.attribute_name='title' THEN cea.value_string END) AS title,
          MAX(CASE WHEN ca.attribute_name='code' THEN cea.value_string END) AS code,
          MAX(CASE WHEN ca.attribute_name='description' THEN cea.value_string END) AS description,
          MAX(CASE WHEN ca.attribute_name='department' THEN cea.value_string END) AS department,
          MAX(CASE WHEN ca.attribute_name='credits' THEN cea.value_number END) AS credits,
          MAX(CASE WHEN ca.attribute_name='semester' THEN cea.value_string END) AS semester,
          MAX(CASE WHEN ca.attribute_name='year' THEN cea.value_number END) AS year

        FROM course_entity ce

        JOIN course_entity_attribute instructor
          ON instructor.entity_id = ce.entity_id
        AND instructor.attribute_id = ?
        AND instructor.value_number = ?

        LEFT JOIN course_entity_attribute cea
          ON cea.entity_id = ce.entity_id
        LEFT JOIN course_attributes ca
          ON ca.attribute_id = cea.attribute_id

        GROUP BY ce.entity_id
        ORDER BY ce.entity_id DESC;
        `,
        [doctorAttrId, Number(doctorId)]
      );

      return { success: true, data: rows };
    } catch (error) {
      console.error("Error in getDoctorCourses:", error);
      return { success: false, message: error.message };
    }
  },
};

module.exports = doctorService;
