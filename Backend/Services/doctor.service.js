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

const doctorService = {
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
        requestedAt: new Date().toISOString()
      };

      await ClassroomValue.createClassroomValue(classroomId, requestAttr.attribute_id, {
        value_string: JSON.stringify(requestData),
        value_number: 0, // 0 for pending status of the request itself
        value_reference: null
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
  
};

module.exports = doctorService;