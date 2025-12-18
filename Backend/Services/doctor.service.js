const ClassroomValue = require("../EAV models/classroom_value");
const ClassroomAttribute = require("../EAV models/classroom_attribute");
const ClassroomEntity = require("../EAV models/classroom_entity");

const CourseAttribute = require("../EAV models/course_attribute");
const CourseEntity = require("../EAV models/course_entity");
const CourseValue = require("../EAV models/course_value");


const UserValue = require("../EAV models/user_value");
const UserAttribute = require("../EAV models/user_attribute");
const UserEntity = require("../EAV models/user_entity");


const pool = require("../Db_config/DB");
const Entity = require("../EAV models/user_entity");

let attributesInitialized = false;

const initializeAttributes = async () => {
  if (attributesInitialized) return;
  try {
    await ClassroomAttribute.createClassroomAttribute("isworking", "string");
    await ClassroomAttribute.createClassroomAttribute("timeslot", "string");
    await ClassroomAttribute.createClassroomAttribute("classroom_requests", "string");
    const assignment = await CourseAttribute.getAttributeByName("assignment");
    if (!assignment) {
      await CourseAttribute.createCourseAttribute("assignment", "string");
    }
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

uploadAssignment: async (courseId, assignmentData, uploadedByDoctorId) => {
  try {
    await initializeAttributes(); // your existing init for "assignment" attr

    // 1. Validate course exists
    const course = await CourseEntity.getCourseById(courseId);
    if (!course) {
      return { success: false, message: "Course not found" };
    }

    // 2. Get the "assigned_course" attribute ID
    const assignedCourseAttr = await UserAttribute.getAttributeByName("assigned_course");
    if (!assignedCourseAttr) {
      return { success: false, message: "System error: assigned_course attribute missing" };
    }

    // 3. Fetch ALL assigned courses for this doctor (multi-value)
    const assignedCourses = await UserValue.getArrayValues(
      uploadedByDoctorId,
      assignedCourseAttr.attribute_id
    );



    // 5. Get the "assignment" attribute for the course
    const assignmentAttr = await CourseAttribute.getAttributeByName("assignment");
    if (!assignmentAttr) {
      return { success: false, message: "Assignment attribute not configured" };
    }

    // 6. Validate required data
    if (!assignmentData || !assignmentData.title?.trim()) {
      return { success: false, message: "Assignment title is required" };
    }

    // 7. Create the assignment object
    const newAssignment = {
      id: Date.now().toString(), // simple unique ID
      title: assignmentData.title.trim(),
      description: assignmentData.description?.trim() || "",
      dueDate: assignmentData.dueDate || null,
      fileUrl: assignmentData.fileUrl || null,
      maxPoints: assignmentData.maxPoints ?? null,
      uploadedBy: uploadedByDoctorId,
      uploadedAt: new Date().toISOString()
    };

    // 8. Save to course's multi-value "assignment" attribute
    await CourseValue.createCourseValue(courseId, assignmentAttr.attribute_id, {
      value_string: JSON.stringify(newAssignment)
      // array_index can be left NULL or you can implement ordering
    });

    return {
      success: true,
      message: "Assignment uploaded successfully",
      data: newAssignment
    };

  } catch (error) {
    console.error("Error in uploadAssignment:", error);
    return {
      success: false,
      message: "Failed to upload assignment: " + error.message
    };
  }
},
};

module.exports = doctorService;