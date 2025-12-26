const adminService = require("../Services/admin.service");
const pool = require("../Db_config/DB");

// ================= CLASSROOMS =================

const createClassroom = async (req, res) => {
  try {
    const { roomName, capacity, type, isworking = 'true', timeslots } = req.body;

    // Validate required fields
    if (!roomName || capacity == null || !type) {
      return res.status(400).json({
        status: "fail",
        message: "roomName, capacity, and type are required",
      });
    }

    const existingClassroom = await adminService.getClassroomByName(roomName);
    if (existingClassroom) {
      return res.status(400).json({ status: "fail", message: "Classroom with this name already exists" });
    }

    if (timeslots) {
      if (!Array.isArray(timeslots)) {
        return res.status(400).json({ status: "fail", message: "timeslots must be an array" });
      }
      for (const slot of timeslots) {
        const { day, start, end } = slot;
        if (!day || !start || !end) {
          return res.status(400).json({ status: "fail", message: "Each timeslot must have day, start and end" });
        }
      }
    }

    const result = await adminService.createClassroom({
      roomName, capacity, type, isworking, timeslots
    });

    if (!result.success) {
      return res.status(400).json({ status: "fail", message: result.message });
    }

    res.status(201).json({
      status: "success",
      data: {
        classroom: {
          id: result.id,
          roomName,
          capacity,
          type,
          isworking,
          timeslots: timeslots || [],
        },
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to create classroom", error: error.message });
  }
};

const getClassrooms = async (req, res) => {
  try {
    // Query classrooms with their attributes
    const [rows] = await pool.query(`
      SELECT 
        ce.entity_id AS _id,
        ce.entity_id AS id,
        MAX(CASE WHEN ca.attribute_name='roomName' THEN cea.value_string END) AS roomName,
        MAX(CASE WHEN ca.attribute_name='capacity' THEN cea.value_number END) AS capacity,
        MAX(CASE WHEN ca.attribute_name='type' THEN cea.value_string END) AS type,
        MAX(CASE WHEN ca.attribute_name='isworking' THEN cea.value_string END) AS isworking,
        GROUP_CONCAT(
          CASE 
            WHEN ca.attribute_name='timeslot' THEN CONCAT(cea.value_id, ':::', cea.value_string) 
          END SEPARATOR '|||'
        ) AS timeslotsRaw
      FROM classroom_entity ce
      LEFT JOIN classroom_entity_attribute cea ON ce.entity_id = cea.entity_id
      LEFT JOIN classroom_attributes ca ON cea.attribute_id = ca.attribute_id
      GROUP BY ce.entity_id
      ORDER BY ce.entity_id DESC
    `);

    const classrooms = rows.map(row => ({
      _id: row._id,
      id: row.id,
      roomName: row.roomName,
      capacity: row.capacity,
      type: row.type,
      isworking: row.isworking,
      timeSlots: row.timeslotsRaw ? row.timeslotsRaw.split('|||').map(s => {
        if (!s) return null;
        const [valId, jsonStr] = s.split(':::');
        try {
          const obj = JSON.parse(jsonStr);
          return { ...obj, _id: valId }; // Attach value_id as _id
        } catch (e) { return null; }
      }).filter(s => s) : []
    }));

    res.status(200).json({
      status: "success",
      results: classrooms.length,
      data: { classrooms },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to fetch classrooms", error: error.message });
  }
};

const updateClassroom = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existingclassroom = await adminService.getClassroomById(id);
    if (!existingclassroom) {
      return res.status(404).json({ status: "fail", message: "Classroom not found" });
    }
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ status: "fail", message: "No update data provided" });
    }
    const result = await adminService.updateClassroom(parseInt(id), updateData);

    if (!result.success) {
      return res.status(400).json({ status: "fail", message: result.message });
    }

    res.status(200).json({ status: "success", message: "Classroom updated successfully" });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to update classroom", error: error.message });
  }
};

const deleteClassroom = async (req, res) => {
  try {
    const result = await adminService.deleteClassroom(req.params.id);
    if (!result.success) {
      return res.status(400).json({ status: "fail", message: result.message });
    }
    res.status(200).json({ status: "success", message: "Classroom deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const getClassroomStatus = async (req, res) => {
  try {
    const classroom = await adminService.getClassroomById(req.params.id);

    if (!classroom) {
      return res.status(404).json({ status: "fail", message: "Classroom not found" });
    }

    // status logic: currently based on 'isWorking' flag
    const status = classroom.isworking

    res.status(200).json({
      status: "success",
      data: {
        classroom,
        status,
        bookedDate: classroom.bookedSchedule,
        requestedBy: classroom.requested_by
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};



// ================= ASSIGNMENTS (Classroom Booking) =================

const assignClassroom = async (req, res) => {
  try {
    const { timeSlot, doctorId } = req.body;
    const classroomId = req.params.id; // Corrected from req.params.id to match common naming, but check route usage. Assuming route /classroom/:id/assign

    if (!timeSlot || !doctorId || !classroomId) {
      return res.status(400).json({ status: "fail", message: "timeSlot, doctorId and classroomId are required" });
    }

    const result = await adminService.assignClassroom(classroomId, timeSlot, doctorId);

    if (!result.success) {
      return res.status(400).json({ status: "fail", message: result.message });
    }

    // Return updated classroom
    const classroom = await adminService.getClassroomById(classroomId);
    return res.status(200).json({ status: "success", data: classroom });

  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const unassignClassroom = async (req, res) => {
  try {
    const { timeSlot, doctorId } = req.body;
    const classroomId = req.params.id;

    if (!timeSlot || !doctorId || !classroomId) {
      return res.status(400).json({ status: "fail", message: "timeSlot, doctorId and classroomId are required" });
    }

    const result = await adminService.unassignClassroom(classroomId, timeSlot, doctorId);

    if (!result.success) {
      return res.status(400).json({ status: "fail", message: result.message });
    }

    const classroom = await adminService.getClassroomById(classroomId);
    return res.status(200).json({ status: "success", data: classroom });

  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};


// ================= ASSIGNMENTS (Doctor-Course) =================

const assignCourseToDoctor = async (req, res) => {
  try {
    const courseId = req.params.id;
    const { doctorId } = req.body;

    if (!courseId || !doctorId) {
      return res.status(400).json({ status: "fail", message: "course ID and Doctor Id is required" });
    }

    const result = await adminService.assignCourseToDoctor(courseId, doctorId);

    if (!result.success) {
      // Maybe doctor or course not found? Service handles this via errors mostly, or robust checks.
      return res.status(400).json({ status: "fail", message: result.message });
    }

    res.status(200).json({ status: "success", message: "Course assigned to doctor" });

  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const unassignCourseFromDoctor = async (req, res) => {
  try {
    const courseId = req.params.id;
    const { doctorId } = req.body;

    if (!courseId || !doctorId) {
      return res.status(400).json({ status: "fail", message: "course ID and Doctor Id is required" });
    }

    const result = await adminService.unassignCourseFromDoctor(courseId, doctorId);
    if (!result.success) {
      return res.status(400).json({ status: "fail", message: result.message });
    }

    res.status(200).json({ status: "success", message: "Course unassigned from doctor" });

  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// ================= TIME SLOTS (Classroom Definition) =================

const addTimeSlot = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { day, start, end, doctorEmail } = req.body;

    if (!day || !start || !end) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Conflict checking
    const classroom = await adminService.getClassroomById(roomId);
    if (!classroom) return res.status(404).json({ message: "Classroom not found" });

    const existingSlots = classroom.timeslots || [];
    const conflict = existingSlots.some(slot => {
      if (slot.day !== day) return false;
      return (start < slot.end && end > slot.start);
    });

    if (conflict) {
      console.log("Conflict detected:", { day, start, end }, "vs existing:", existingSlots);
      return res.status(400).json({ message: "Time slot conflicts with existing schedule" });
    }

    const result = await adminService.addTimeSlot(roomId, { day, start, end, doctorEmail });
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    res.status(201).json({ status: "success", message: "Time slot added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding time slot" });
  }
};

const updateTimeSlot = async (req, res) => {
  try {
    const { roomId, slotId } = req.params;
    const { day, start, end, doctorEmail } = req.body;

    if (!day || !start || !end) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Fetch classroom to check existence
    const classroom = await adminService.getClassroomById(roomId);
    if (!classroom) return res.status(404).json({ message: "Classroom not found" });

    // Conflict check
    const existingSlots = classroom.timeslots || [];
    const conflict = existingSlots.some(slot => {
      // Ignore the slot we are updating (compare value_id)
      if (String(slot.id) === String(slotId) || String(slot._id) === String(slotId)) return false;
      if (slot.day !== day) return false;
      return (start < slot.end && end > slot.start);
    });

    if (conflict) {
      return res.status(400).json({ message: "Time slot conflicts with existing schedule" });
    }

    const result = await adminService.updateTimeSlot(roomId, slotId, { day, start, end, doctorEmail });
    if (!result.success) return res.status(400).json({ message: result.message });

    res.status(200).json({ status: "success", message: "Time slot updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating time slot" });
  }
};

const deleteTimeSlot = async (req, res) => {
  try {
    const { roomId, slotId } = req.params;
    // Check classroom
    const classroom = await adminService.getClassroomById(roomId);
    if (!classroom) return res.status(404).json({ message: "Classroom not found" });

    const result = await adminService.deleteTimeSlot(roomId, slotId);
    if (!result.success) return res.status(400).json({ message: result.message });

    res.status(200).json({ status: "success", message: "Time slot deleted successfully" });
  } catch (err) {
    console.error("Controller Error:", err);
    res.status(500).json({ message: "Error deleting time slot" });
  }
};

// ================= ENROLLMENTS =================

const acceptEnrollments = async (req, res) => {
  try {
    const { student } = req.params;
    const result = await adminService.acceptEnrollments(student);

    if (!result.success) {
      return res.status(500).json({ message: "Error managing enrollments", error: result.message });
    }

    // Check if any updated?
    if (!result.data || result.data.length === 0) {

      return res.status(404).json({ message: "No pending enrollments found for this student" });
    }

    res.status(200).json({
      status: "success",
      data: { enrollments: result.data },
    });
  } catch (error) {
    res.status(500).json({ message: "Error managing enrollments", error: error.message });
  }
};

const rejectEnrollments = async (req, res) => {
  try {
    const { student } = req.params;
    const result = await adminService.rejectEnrollments(student);

    if (!result.success) {
      return res.status(500).json({ message: "Error managing enrollments", error: result.message });
    }

    if (!result.data || result.data.length === 0) {
      return res.status(404).json({ message: "No pending enrollments found for this student" });
    }

    res.status(200).json({
      status: "success",
      data: { enrollments: result.data },
    });
  } catch (error) {
    res.status(500).json({ message: "Error managing enrollments", error: error.message });
  }
};

// ================= STUDENTS =================

const getStudents = async (req, res) => {
  try {
    const result = await adminService.getallStudents();
    if (!result.success) throw new Error(result.message);

    res.status(200).json({
      status: "success",
      results: result.students.length,
      data: result.students
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve students", error: error.message });
  }
};

// ================= PARENT LINKING =================

const getPendingParentRequests = async (req, res) => {
  const result = await adminService.getPendingParentLinks();
  if (result.success) {
    res.json({ success: true, data: result.data });
  } else {
    res.status(500).json({ success: false, message: result.message });
  }
};

const approveParentRequest = async (req, res) => {
  const { id } = req.params;
  const result = await adminService.approveParentLink(id);
  if (result.success) {
    res.json({ success: true, message: result.message });
  } else {
    res.status(500).json({ success: false, message: result.message });
  }
};

const rejectParentRequest = async (req, res) => {
  const { id } = req.params;
  const result = await adminService.rejectParentLink(id);
  if (result.success) {
    res.json({ success: true, message: result.message });
  } else {
    res.status(500).json({ success: false, message: result.message });
  }
};

module.exports = {
  updateTimeSlot, deleteTimeSlot, addTimeSlot,
  createClassroom, getClassrooms, updateClassroom, deleteClassroom, getClassroomStatus,
  assignClassroom, unassignClassroom,
  assignCourseToDoctor, unassignCourseFromDoctor,
  acceptEnrollments, rejectEnrollments,
  getStudents,
  getPendingParentRequests, approveParentRequest, rejectParentRequest
};