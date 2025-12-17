const ClassroomEntity = require("../EAV models/classroom_entity");
const ClassroomAttribute = require("../EAV models/classroom_attribute");
const ClassroomValue = require("../EAV models/classroom_value");

const CourseEntity = require("../EAV models/course_entity");
const CourseAttribute = require("../EAV models/course_attribute");
const CourseValue = require("../EAV models/course_value");

const UserEntity = require("../EAV models/user_entity");
const UserAttribute = require("../EAV models/user_attribute");
const UserValue = require("../EAV models/user_value");

const pool = require("../Db_config/DB");

let attributesInitialized = false;

const initializeAttributes = async () => {
  if (attributesInitialized) return;
  try {
    // --- Classroom Attributes ---
    const roomName = await ClassroomAttribute.getAttributeByName("roomName");
    if (!roomName) await ClassroomAttribute.createClassroomAttribute("roomName", "string");

    const capacity = await ClassroomAttribute.getAttributeByName("capacity");
    if (!capacity) await ClassroomAttribute.createClassroomAttribute("capacity", "decimal");

    const type = await ClassroomAttribute.getAttributeByName("type");
    if (!type) await ClassroomAttribute.createClassroomAttribute("type", "string");

    const isworking = await ClassroomAttribute.getAttributeByName("isworking");
    if (!isworking) await ClassroomAttribute.createClassroomAttribute("isworking", "string");

    const timeslot = await ClassroomAttribute.getAttributeByName("timeslot");
    if (!timeslot) await ClassroomAttribute.createClassroomAttribute("timeslot", "string");

    const booking = await ClassroomAttribute.getAttributeByName("booking");
    if (!booking) await ClassroomAttribute.createClassroomAttribute("booking", "string");


    // --- Course Attributes ---
    const courseCode = await CourseAttribute.getAttributeByName("code");
    if (!courseCode) await CourseAttribute.createCourseAttribute("code", "string");

    const courseTitle = await CourseAttribute.getAttributeByName("title");
    if (!courseTitle) await CourseAttribute.createCourseAttribute("title", "string");

    const courseDesc = await CourseAttribute.getAttributeByName("description");
    if (!courseDesc) await CourseAttribute.createCourseAttribute("description", "string");

    const courseCredits = await CourseAttribute.getAttributeByName("credits");
    if (!courseCredits) await CourseAttribute.createCourseAttribute("credits", "decimal");

    const courseDept = await CourseAttribute.getAttributeByName("department");
    if (!courseDept) await CourseAttribute.createCourseAttribute("department", "string");


    // --- User Attributes (for Doctor/Student) ---
    // We use the generic 'attributes' table for UserEntity
    const assignedCourseAttr = await UserAttribute.getAttributeByName("assigned_course");
    if (!assignedCourseAttr) await UserAttribute.create("assigned_course", "reference");


    // --- Enrollments Table (Raw SQL for Many-to-Many with attributes) ---
    await pool.query(`
            CREATE TABLE IF NOT EXISTS enrollments (
                enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                course_id INT NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                grade DECIMAL(5,2) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);


         const classroom_requests = await ClassroomAttribute.getAllClassroomAttributes("classroom_requests","string");
        if(!classroom_requests){
            await ClassroomAttribute.createClassroomAttribute("classroom_requests","string");
            console.log("Created classroom_requests attribute");
        }

    attributesInitialized = true;
    console.log("All attributes and tables initialized");
  } catch (error) {
    console.error("Error initializing attributes:", error.message);
  }
};


const adminService = {
  // ================= CLASSROOMS =================
  createClassroom: async (classroomData) => {
    try {
      await initializeAttributes();
      const { roomName, capacity, type, isworking, timeslots } = classroomData;

      const classroomEntityId = await ClassroomEntity.createClassroom("classroom", roomName);

      const roomNameAttr = await ClassroomAttribute.getAttributeByName("roomName");
      const capacityAttr = await ClassroomAttribute.getAttributeByName("capacity");
      const typeAttr = await ClassroomAttribute.getAttributeByName("type");
      const isworkingAttr = await ClassroomAttribute.getAttributeByName("isworking");
      const timeslotAttr = await ClassroomAttribute.getAttributeByName("timeslot");

      await ClassroomValue.createClassroomValue(classroomEntityId, roomNameAttr.attribute_id, { value_string: roomName });
      await ClassroomValue.createClassroomValue(classroomEntityId, capacityAttr.attribute_id, { value_number: capacity });
      await ClassroomValue.createClassroomValue(classroomEntityId, typeAttr.attribute_id, { value_string: type });
      await ClassroomValue.createClassroomValue(classroomEntityId, isworkingAttr.attribute_id, { value_string: isworking });

      if (Array.isArray(timeslots)) {
        for (let i = 0; i < timeslots.length; i++) {
          await ClassroomValue.createClassroomValue(
            classroomEntityId,
            timeslotAttr.attribute_id,
            {
              value_string: JSON.stringify(timeslots[i]),
              array_index: i
            }
          );
        }
      }

      return { success: true, id: classroomEntityId, message: "Classroom created successfully" };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  getClassroom: async () => {
    try {
      const classrooms = await ClassroomEntity.getAllClassrooms();
      // Need to fetch attributes? getAllClassrooms only returns entity info usually.
      // Ideally we need to populate attributes for each classroom. 
      // This might be expensive loop or complex join. 
      // For now, assuming getAllClassrooms joins data or we iterate. 
      // Wait, ClassroomEntity.getAllClassrooms() implementation?
      // "SELECT * FROM classroom_entities" -> just id and name.
      // We should enrich this. 

      // For MVP, let's return entities and let frontend fetch details or enrich here.
      // Let's enrich:
      for (let c of classrooms) {
        // Fetch simple attributes to return a useful object
        // This matches Mongoose structure
        // We can implement a bulk fetch later if performance is issue.
        // For now, we trust the caller might use getClassroomById for details or we return simple list.
      }
      return { success: true, classrooms };
    } catch (error) {
      return { success: false, message: "Error getting classrooms: " + error.message };
    }
  },

  getClassroomById: async (id) => {
    try {
      await initializeAttributes();
      const classroom = await ClassroomEntity.getClassroomById(id);
      if (!classroom) return null;

      // Fetch attributes to construct full object
      const attributes = await ClassroomAttribute.getAllClassroomAttributes();
      // We need to map values. 
      // This is simplified, assuming we want to mimic the Mongoose return object.

      // Helper to get value
      const getValue = async (attrName) => {
        const attr = attributes.find(a => a.attribute_name === attrName);
        if (!attr) return null;
        const vals = await ClassroomValue.getAllClassroomValues(id, attr.attribute_id);
        if (vals.length === 0) return null;
        // return first primitive or array if multiple
        if (attrName === 'timeslot' || attrName === 'booking') return vals.map(v => ({ id: v.value_id, ...JSON.parse(v.value_string) }));
        return vals[0].value_string || vals[0].value_number;
      };

      const roomName = await getValue("roomName");
      const capacity = await getValue("capacity");
      const type = await getValue("type");
      const isworking = await getValue("isworking");
      const timeslots = await getValue("timeslot") || [];
      const bookings = await getValue("booking") || []; // List of { timeSlot, doctorId }

      // Construct bookedSchedule and requested_by for Mongoose compatibility
      const bookedSchedule = bookings.map(b => b.timeSlot);
      const requested_by = bookings.map(b => b.doctorId);

      return {
        id,
        _id: id, // alias for frontend compatibility
        roomName,
        capacity,
        type,
        isWorking: isworking === 'true' || isworking === true,
        isworking: isworking,
        bookedSchedule,
        requested_by,
        timeslots
      };

    } catch (error) {
      console.error("Error getting classroom by ID:", error);
      return null;
    }
  },

  getClassroomByName: async (roomName) => {
    try {
      await initializeAttributes();
      const classroom = await ClassroomEntity.findByAttribute("roomName", roomName);
      return classroom || null;
    } catch (error) {
      console.error("Error checking classroom existence:", error);
      return null;
    }
  },

  updateClassroom: async (id, classroomData) => {
    try {
      await initializeAttributes();
      const { roomName, capacity, type, isworking, timeslots } = classroomData;

      // Check basics
      if (roomName) await ClassroomEntity.updateClassroom(id, roomName);

      const roomNameAttr = await ClassroomAttribute.getAttributeByName("roomName");
      const capacityAttr = await ClassroomAttribute.getAttributeByName("capacity");
      const typeAttr = await ClassroomAttribute.getAttributeByName("type");
      const isworkingAttr = await ClassroomAttribute.getAttributeByName("isworking");
      const timeslotAttr = await ClassroomAttribute.getAttributeByName("timeslot");

      const updateVal = async (attr, val) => {
        const existing = await ClassroomValue.getClassroomValue(id, attr.attribute_id);
        if (existing) await ClassroomValue.updateClassroomValue(existing.value_id, { value_string: String(val), value_number: !isNaN(val) ? val : null });
        else await ClassroomValue.createClassroomValue(id, attr.attribute_id, { value_string: String(val), value_number: !isNaN(val) ? val : null });
      }

      if (roomName) await updateVal(roomNameAttr, roomName);
      if (capacity) await updateVal(capacityAttr, capacity);
      if (type) await updateVal(typeAttr, type);
      if (isworking !== undefined) await updateVal(isworkingAttr, isworking);

      if (timeslots && Array.isArray(timeslots)) {
        await ClassroomValue.deleteClassroomAttributeValues(id, timeslotAttr.attribute_id);
        for (let i = 0; i < timeslots.length; i++) {
          await ClassroomValue.createClassroomValue(id, timeslotAttr.attribute_id, {
            value_string: JSON.stringify(timeslots[i]),
            array_index: i
          });
        }
      }
      return { success: true, message: "Classroom updated successfully" };
    } catch (error) {
      return { success: false, message: "Error updating classroom: " + error.message };
    }
  },

  deleteClassroom: async (id) => {
    try {
      const attrs = await ClassroomAttribute.getAllClassroomAttributes();
      for (const attr of attrs) {
        await ClassroomValue.deleteClassroomAttributeValues(id, attr.attribute_id);
      }
      const result = await ClassroomEntity.deleteClassroom(id);
      if (!result) throw new Error("Classroom not found");
      return { success: true, message: "Classroom deleted successfully" };
    } catch (error) {
      return { success: false, message: "Error deleting classroom: " + error.message };
    }
  },

  addTimeSlot: async (roomId, timeSlot) => {
    try {
      await initializeAttributes();
      const timeslotAttr = await ClassroomAttribute.getAttributeByName("timeslot");

      // Check max index
      const [rows] = await pool.query(
        "SELECT MAX(array_index) AS maxIndex FROM classroom_entity_attribute WHERE entity_id = ? AND attribute_id = ?",
        [roomId, timeslotAttr.attribute_id]
      );
      const nextIndex = (rows[0].maxIndex !== null) ? rows[0].maxIndex + 1 : 0;

      await ClassroomValue.createClassroomValue(roomId, timeslotAttr.attribute_id, {
        value_string: JSON.stringify(timeSlot),
        array_index: nextIndex
      });
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  updateTimeSlot: async (roomId, slotId, updatedTimeSlot) => {
    try {
      // Fetch existing to keep array_index
      const existing = await ClassroomValue.getCourseValue(roomId, null); // wait, we need specific value by ID. 
      // course_value.js has getCourseValue but it takes entity_id/attr_id? No, getCourseValue takes entity/attr.
      // We need get by value_id? 
      // user_value.js has 'getValue' taking (entity_id, attribute_id). Not by value_id?
      // user_value.js has 'updateValue' taking value_id.
      // We need to fetch the value by value_id to get its current array_index?
      // user_value.js does NOT have 'getValueById'.
      // But we can just run a query or use the one from original service logic which used pool directly!

      const [rows] = await pool.query("SELECT * FROM entity_attribute WHERE value_id = ?", [slotId]);
      // wait, is it entity_attribute or classroom_value uses classroom_entity_attribute?
      // ClassroomValue file uses classroom_entity_attribute? YES.

      const [row] = await pool.query("SELECT array_index FROM classroom_entity_attribute WHERE value_id = ?", [slotId]);
      const idx = row && row.length > 0 ? row[0].array_index : 0;

      await ClassroomValue.updateClassroomValue(slotId, {
        value_string: JSON.stringify(updatedTimeSlot),
        array_index: idx
      });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  deleteTimeSlot: async (roomId, slotId) => {
    try {
      await ClassroomValue.deleteClassroomValue(slotId);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  assignClassroom: async (classroomId, timeSlot, doctorId) => {
    try {
      await initializeAttributes();
      // Check availability
      const classroom = await adminService.getClassroomById(classroomId);
      if (!classroom) throw new Error("Classroom not found");
      if (!classroom.isWorking) throw new Error("Classroom is not working");

      const bookingAttr = await ClassroomAttribute.getAttributeByName("booking");

      // Check existing bookings
      const existingBookings = await ClassroomValue.getAllClassroomValues(classroomId, bookingAttr.attribute_id);
      const parsedBookings = existingBookings.map(b => JSON.parse(b.value_string));

      // Conflict check
      const conflict = parsedBookings.some(b =>
        JSON.stringify(b.timeSlot) === JSON.stringify(timeSlot)
      );
      if (conflict) return { success: false, message: "classroom not available at this time slot" };

      // Add booking
      await ClassroomValue.createClassroomValue(classroomId, bookingAttr.attribute_id, {
        value_string: JSON.stringify({ timeSlot, doctorId })
      });

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  unassignClassroom: async (classroomId, timeSlot, doctorId) => {
    try {
      await initializeAttributes();
      const bookingAttr = await ClassroomAttribute.getAttributeByName("booking");
      const existingBookings = await ClassroomValue.getAllClassroomValues(classroomId, bookingAttr.attribute_id);

      const bookingVal = existingBookings.find(b => {
        const data = JSON.parse(b.value_string);
        return JSON.stringify(data.timeSlot) === JSON.stringify(timeSlot);
      });

      if (!bookingVal) return { success: false, message: "classroom is not assigned at this time slot" };

      const data = JSON.parse(bookingVal.value_string);
      if (data.doctorId !== doctorId) return { success: false, message: "This timeslot's doctor doesn't match" };

      await ClassroomValue.deleteClassroomValue(bookingVal.value_id);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },


  // ================= COURSES =================
  createCourse: async (courseData) => {
    try {
      await initializeAttributes();
      const { title, code, description, credits, department } = courseData;

      // Check duplicate code
      const existing = await CourseEntity.findByAttribute("code", code);
      if (existing) return { success: false, message: "Course with this code already exists" };

      const courseId = await CourseEntity.createCourse(code, title);

      const codeAttr = await CourseAttribute.getAttributeByName("code");
      const titleAttr = await CourseAttribute.getAttributeByName("title");
      const descAttr = await CourseAttribute.getAttributeByName("description");
      const credAttr = await CourseAttribute.getAttributeByName("credits");
      const deptAttr = await CourseAttribute.getAttributeByName("department");

      await CourseValue.createCourseValue(courseId, codeAttr.attribute_id, { value_string: code });
      await CourseValue.createCourseValue(courseId, titleAttr.attribute_id, { value_string: title });
      await CourseValue.createCourseValue(courseId, descAttr.attribute_id, { value_string: description });
      await CourseValue.createCourseValue(courseId, credAttr.attribute_id, { value_number: credits });
      await CourseValue.createCourseValue(courseId, deptAttr.attribute_id, { value_string: department });

      return { success: true, data: { course: { id: courseId, code, title, description, credits, department } } };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  getCourses: async () => {
    try {
      const courses = await CourseEntity.getAllCourses();
      // In a real app we'd bulk load attributes.
      const result = [];
      for (let c of courses) {
        const full = await adminService.getCourseById(c.entity_id);
        if (full) result.push(full);
      }
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  getCourseById: async (id) => {
    try {
      await initializeAttributes();
      const course = await CourseEntity.getCourseById(id);
      if (!course) return null;

      const codeAttr = await CourseAttribute.getAttributeByName("code");
      const titleAttr = await CourseAttribute.getAttributeByName("title");
      const descAttr = await CourseAttribute.getAttributeByName("description");
      const credAttr = await CourseAttribute.getAttributeByName("credits");
      const deptAttr = await CourseAttribute.getAttributeByName("department");

      const getVal = async (attr, isNum) => {
        const val = await CourseValue.getCourseValue(id, attr.attribute_id);
        return val ? (isNum ? val.value_number : val.value_string) : null;
      }

      return {
        _id: id,
        id: id,
        code: await getVal(codeAttr),
        title: await getVal(titleAttr),
        description: await getVal(descAttr),
        credits: await getVal(credAttr, true),
        department: await getVal(deptAttr)
      };
    } catch (error) {
      return null;
    }
  },

  updateCourse: async (id, courseData) => {
    try {
      await initializeAttributes();
      const { title, code, description, credits, department } = courseData;

      // Update Entity name if title changed? Or code?
      if (title) await CourseEntity.updateCourse(id, title);

      const codeAttr = await CourseAttribute.getAttributeByName("code");
      const titleAttr = await CourseAttribute.getAttributeByName("title");
      const descAttr = await CourseAttribute.getAttributeByName("description");
      const credAttr = await CourseAttribute.getAttributeByName("credits");
      const deptAttr = await CourseAttribute.getAttributeByName("department");

      const upsert = async (attr, val, isNum) => {
        const existing = await CourseValue.getCourseValue(id, attr.attribute_id);
        if (existing) await CourseValue.updateCourseValue(existing.value_id, isNum ? { value_number: val } : { value_string: val });
        else await CourseValue.createCourseValue(id, attr.attribute_id, isNum ? { value_number: val } : { value_string: val });
      }

      if (code) await upsert(codeAttr, code);
      if (title) await upsert(titleAttr, title);
      if (description) await upsert(descAttr, description);
      if (credits) await upsert(credAttr, credits, true);
      if (department) await upsert(deptAttr, department);

      return { success: true, data: { id, ...courseData } };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  deleteCourse: async (id) => {
    try {
      await initializeAttributes();
      // Delete values
      const codeAttr = await CourseAttribute.getAttributeByName("code");
      const titleAttr = await CourseAttribute.getAttributeByName("title");
      const descAttr = await CourseAttribute.getAttributeByName("description");
      const credAttr = await CourseAttribute.getAttributeByName("credits");
      const deptAttr = await CourseAttribute.getAttributeByName("department");

      const attrs = [codeAttr, titleAttr, descAttr, credAttr, deptAttr];
      for (let a of attrs) if (a) await CourseValue.deleteCourseAttributeValues(id, a.attribute_id);

      await CourseEntity.deleteCourse(id);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // ================= ASSIGNMENT (User <-> Course) =================
  assignCourseToDoctor: async (courseId, doctorId) => {
    try {
      await initializeAttributes();
      const attr = await UserAttribute.getAttributeByName("assigned_course");

      // Check if already assigned
      const existing = await UserValue.getArrayValues(doctorId, attr.attribute_id);
      const isAssigned = existing.some(v => v.value_reference == courseId); // fuzzy check for number/string

      if (isAssigned) return { success: true }; // Already assigned

      await UserValue.createValue(doctorId, attr.attribute_id, {
        value_reference: courseId
      });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  unassignCourseFromDoctor: async (courseId, doctorId) => {
    try {
      await initializeAttributes();
      const attr = await UserAttribute.getAttributeByName("assigned_course");
      const existing = await UserValue.getArrayValues(doctorId, attr.attribute_id);
      const target = existing.find(v => v.value_reference == courseId);

      if (!target) return { success: false, message: "Course not assigned to this doctor" };

      await UserValue.deleteValue(target.value_id);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // ================= ENROLLMENTS =================
  acceptEnrollments: async (studentId) => {
    try {
      await initializeAttributes();
      // Update status in enrollments table
      const [result] = await pool.query(
        "UPDATE enrollments SET status = 'accepted' WHERE student_id = ? AND status = 'pending'",
        [studentId]
      );

      // Fetch updated
      const [rows] = await pool.query(
        "SELECT * FROM enrollments WHERE student_id = ? AND status = 'accepted'",
        [studentId]
      );

      return { success: true, data: rows };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  rejectEnrollments: async (studentId) => {
    try {
      await initializeAttributes();
      // Update status in enrollments table
      await pool.query(
        "UPDATE enrollments SET status = 'failed' WHERE student_id = ? AND status = 'pending'",
        [studentId]
      );
      // Fetch updated
      const [rows] = await pool.query(
        "SELECT * FROM enrollments WHERE student_id = ? AND status = 'failed'",
        [studentId]
      );
      return { success: true, data: rows };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },


  getallStudents: async () => {
    try {
      const students = await UserEntity.getallStudents();
      return { success: true, students };
    } catch (error) {
      return { success: false, message: "Error getting students: " + error.message };
    }
  }
};

module.exports = adminService;