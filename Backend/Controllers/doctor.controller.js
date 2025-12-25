const doctorService = require("../Services/doctor.service");

// ===================== Book Classroom =====================
const bookClassroom = async (req, res) => {
  try {
    const { doctorId, classroomId, slotId } = req.body;

    if (!classroomId || !slotId || !doctorId) {
      return res.status(400).json({
        status: "fail",
        message:
          "doctorId, classroomId, and slotId (the specific ID of the timeslot) are required",
      });
    }

    const result = await doctorService.bookClassroomRequest(classroomId, slotId, doctorId);

    if (!result.success) {
      return res.status(400).json({
        status: "fail",
        message: result.message,
      });
    }

    return res.status(200).json({
      status: "success",
      message: result.message,
    });
  } catch (error) {
    console.error("Controller Error in bookClassroom:", error);
    return res.status(500).json({
      status: "error",
      message: "An unexpected error occurred while processing the booking request",
      error: error.message,
    });
  }
};

// ===================== Get Doctor Courses =====================
// GET /doctor/courses/:doctorId
const getDoctorCourses = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!doctorId) {
      return res.status(400).json({
        status: "fail",
        message: "doctorId is required",
      });
    }

    const result = await doctorService.getDoctorCourses(doctorId);

    if (!result.success) {
      // Return 403 for setup-related errors, 400 for bad requests
      const statusCode = result.code === 'STAFF_NOT_SETUP' ? 403 : 400;
      return res.status(statusCode).json({
        status: "fail",
        message: result.message,
        code: result.code,
      });
    }

    return res.status(200).json({
      status: "success",
      data: result.data, // array of courses
    });
  } catch (error) {
    console.error("Controller Error in getDoctorCourses:", error);
    return res.status(500).json({
      status: "error",
      message: "An unexpected error occurred while fetching doctor courses",
      error: error.message,
    });
  }
};

// ===================== Create Course Assignment =====================
// POST /doctor/courses/:courseId/assignments
const createCourseAssignment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { doctorId, title, description, dueDate, totalMarks, type, status } = req.body;

    if (!courseId || !doctorId || !title || !dueDate) {
      return res.status(400).json({
        status: "fail",
        message: "courseId (param), doctorId, title, and dueDate are required",
      });
    }

    const result = await doctorService.createCourseAssignment(doctorId, courseId, {
      title,
      description,
      dueDate,
      totalMarks,
      type: type || "assignment",      
      status: status || "active",      
    });

    if (!result.success) {
      return res.status(400).json({
        status: "fail",
        message: result.message,
      });
    }

    return res.status(201).json({
      status: "success",
      message: "Assessment created successfully",
      data: result.data, // { assignmentId }
    });
  } catch (error) {
    console.error("Controller Error in createCourseAssignment:", error);
    return res.status(500).json({
      status: "error",
      message: "An unexpected error occurred while creating assessment",
      error: error.message,
    });
  }
};
// ===================== Create Course Quiz =====================
const createCourseQuiz = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { doctorId, title, description, dueDate, totalMarks, type, status } = req.body;

    if (!courseId || !doctorId || !title || !dueDate) {
      return res.status(400).json({
        status: "fail",
        message: "courseId (param), doctorId, title, and dueDate are required",
      });
    }

    const result = await doctorService.createCourseQuiz(doctorId, courseId, {
      title,
      description,
      dueDate,
      totalMarks,
      type: type || "quiz",      
      status: status || "active",      
    });

    if (!result.success) {
      return res.status(400).json({
        status: "fail",
        message: result.message,
      });
    }

    return res.status(201).json({
      status: "success",
      message: "Quiz created successfully",
      data: result.data, 
    });
  } catch (error) {
    console.error("Controller Error in createCourseQuiz:", error);
    return res.status(500).json({
      status: "error",
      message: "An unexpected error occurred while creating assessment",
      error: error.message,
    });
  }
};




// ===================== Get Course Assessments =====================
// GET /doctor/courses/:courseId/assessments
const getCourseAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        status: "fail",
        message: "courseId is required",
      });
    }

    const result = await doctorService.getCourseAssignmentsForStudents(courseId);

    if (!result.success) {
      return res.status(400).json({
        status: "fail",
        message: result.message,
      });
    }

    return res.status(200).json({
      status: "success",
      data: result.data,
    });
  } catch (error) {
    console.error("Controller Error in getCourseAssignments:", error);
    return res.status(500).json({
      status: "error",
      message: "An unexpected error occurred while fetching assessments",
      error: error.message,
    });
  }
};
const getCourseQuizzes = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        status: "fail",
        message: "courseId is required",
      });
    }

    // Call the new service method we created in the previous step
    const result = await doctorService.getCourseQuizzesForStudents(courseId);

    if (!result.success) {
      return res.status(400).json({
        status: "fail",
        message: result.message,
      });
    }

    return res.status(200).json({
      status: "success",
      count: result.data.length,
      data: result.data,
    });
  } catch (error) {
    console.error("Controller Error in getCourseQuizzes:", error);
    return res.status(500).json({
      status: "error",
      message: "An unexpected error occurred while fetching quizzes",
      error: error.message,
    });
  }
};

// ===================== Update Assessment =====================
// PUT /doctor/assessments/:assignmentId
const updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { doctorId, title, description, dueDate, totalMarks, type, status } = req.body;

    if (!doctorId) {
      return res.status(400).json({ status: "fail", message: "doctorId is required" });
    }

    const result = await doctorService.updateCourseAssignment(doctorId, assignmentId, {
      title,
      description,
      dueDate,
      totalMarks,
      type,     
      status,   
    });

    if (!result.success) {
      return res.status(400).json({ status: "fail", message: result.message });
    }

    return res.status(200).json({ status: "success", message: "Assessment updated" });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message });
  }
};

// ===================== Update Quiz =====================
const updateQuiz = async (req, res) => {
  try {
    const { quizId } = req.params; // Assuming your route is /quizzes/:quizId
    const { doctorId, title, description, dueDate, totalMarks, type, status } = req.body;

    if (!doctorId) {
      return res.status(400).json({ 
        status: "fail", 
        message: "doctorId is required" 
      });
    }

    // Call the quiz-specific service method
    const result = await doctorService.updateCourseQuiz(doctorId, quizId, {
      title,
      description,
      dueDate,
      totalMarks,
      type,     // e.g., 'quiz' or 'exam'
      status,   // e.g., 'active' or 'archived'
    });

    if (!result.success) {
      return res.status(400).json({ 
        status: "fail", 
        message: result.message 
      });
    }

    return res.status(200).json({ 
      status: "success", 
      message: "Quiz updated successfully" 
    });
  } catch (e) {
    console.error("Controller Error in updateQuiz:", e);
    return res.status(500).json({ 
      status: "error", 
      message: "An unexpected error occurred", 
      error: e.message 
    });
  }
};

const uploadAssignmentAttachment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { name } = req.body;

    if (!req.file) {
      return res.status(400).json({ status: "fail", message: "No file uploaded" });
    }

    const file = req.file;

    // url served by express.static("/uploads", ...)
    const url = `/uploads/assignments/${file.filename}`;

    const result = await doctorService.addAssignmentAttachment(assignmentId, {
      name: name || file.originalname,
      url,
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    if (!result.success) {
      return res.status(400).json({ status: "fail", message: result.message });
    }

    return res.status(200).json({
      status: "success",
      message: "Attachment uploaded",
      data: result.data, // updated attachments array
    });
  } catch (error) {
    console.error("uploadAssignmentAttachment controller error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const getCourseStudents = async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await doctorService.getCourseStudents(courseId);

    if (!result.success) {
      return res.status(400).json({ status: "fail", message: result.message });
    }

    return res.status(200).json({ status: "success", data: result.data });
  } catch (error) {
    console.error("Controller Error in getCourseStudents:", error);
    return res.status(500).json({
      status: "error",
      message: "An unexpected error occurred while fetching students",
      error: error.message,
    });
  }
};

// ===================== Course Resources =====================
const getCourseResources = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        status: "fail",
        message: "courseId is required",
      });
    }

    console.log(`[getCourseResources] Fetching resources for course ${courseId}`);
    const result = await doctorService.getCourseResources(courseId);

    if (!result.success) {
      console.error(`[getCourseResources] Error: ${result.message}`);
      return res.status(400).json({ status: "fail", message: result.message });
    }

    console.log(`[getCourseResources] Found ${result.data.length} resources`);
    return res.status(200).json({ status: "success", data: result.data });
  } catch (error) {
    console.error("Controller Error in getCourseResources:", error);
    return res.status(500).json({
      status: "error",
      message: "An unexpected error occurred while fetching course resources",
      error: error.message,
    });
  }
};

const uploadCourseResource = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description } = req.body;
    const doctorId = req.body.doctorId;

    console.log('[uploadCourseResource] Request:', { courseId, doctorId, title, hasFile: !!req.file });

    if (!courseId || !doctorId || !title) {
      console.error('[uploadCourseResource] Missing fields:', { courseId, doctorId, title, hasFile: !!req.file });
      return res.status(400).json({
        status: "fail",
        message: `Missing required fields. courseId: ${courseId}, doctorId: ${doctorId}, title: ${title}, file: ${req.file ? 'yes' : 'no'}`,
      });
    }

    if (!req.file) {
      console.error('[uploadCourseResource] No file provided');
      return res.status(400).json({
        status: "fail",
        message: "No file provided",
      });
    }

    const file = req.file;
    const url = `/uploads/resources/${file.filename}`;

    console.log('[uploadCourseResource] Calling service with:', { courseId, doctorId, title, fileName: file.originalname });
    const result = await doctorService.uploadCourseResource(courseId, doctorId, {
      title,
      description,
      fileName: file.originalname,
      filePath: url,
      fileType: file.mimetype.split('/')[0],
      fileSize: file.size,
    });

    if (!result.success) {
      console.error('[uploadCourseResource] Service error:', result.message);
      return res.status(400).json({ status: "fail", message: result.message });
    }

    console.log('[uploadCourseResource] Success, resource ID:', result.data?.resource_id);
    return res.status(200).json({
      status: "success",
      message: "Resource uploaded successfully",
      data: result.data,
    });
  } catch (error) {
    console.error("uploadCourseResource controller error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ===================== Course Staff (TAs) =====================
const getCourseStaff = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        status: "fail",
        message: "courseId is required",
      });
    }

    console.log(`Fetching staff for course ${courseId}`);

    const result = await doctorService.getCourseStaff(courseId);

    if (!result.success) {
      console.error(`Error fetching staff: ${result.message}`);
      return res.status(400).json({ status: "fail", message: result.message });
    }

    return res.status(200).json({ status: "success", data: result.data });
  } catch (error) {
    console.error("Controller Error in getCourseStaff:", error);
    return res.status(500).json({
      status: "error",
      message: "An unexpected error occurred while fetching course staff",
      error: error.message,
    });
  }
};

// ===================== Course Schedule =====================
const getCourseSchedule = async (req, res) => {
  try {
    const { courseId, doctorId } = req.params;

    if (!courseId || !doctorId) {
      return res.status(400).json({
        status: "fail",
        message: "courseId and doctorId are required",
      });
    }

    console.log(`Fetching schedule for course ${courseId}, doctor ${doctorId}`);

    const result = await doctorService.getCourseSchedule(courseId, doctorId);

    if (!result.success) {
      console.error(`Error fetching schedule: ${result.message}`);
      return res.status(400).json({ status: "fail", message: result.message });
    }

    return res.status(200).json({ status: "success", data: result.data });
  } catch (error) {
    console.error("Controller Error in getCourseSchedule:", error);
    return res.status(500).json({
      status: "error",
      message: "An unexpected error occurred while fetching course schedule",
      error: error.message,
    });
  }
};

// GET /api/doctor/by-email?email=...
const getDoctorByEmail = async (req, res) => {
  const { email } = req.query;
  const result = await doctorService.getDoctorByEmail(email);

  if (!result.success) return res.status(400).json(result);
  return res.status(200).json(result);
};

const updateMyDoctorProfile = async (req, res) => {
  try {
    const userEntityId = req.user?.id; // entities.entity_id
    if (!userEntityId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // editable fields only
    const payload = {
      name: req.body?.name,
      phone: req.body?.phone,
      officePhone: req.body?.officePhone,
      officeLocation: req.body?.officeLocation,
      bio: req.body?.bio,
      specialization: req.body?.specialization,
    };

    const result = await doctorService.updateMyDoctorProfile(userEntityId, payload);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (e) {
    console.error("updateMyDoctorProfile controller error:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};


// ===================== Office Hours =====================
// GET /doctor/office-hours/:doctorId
const getMyOfficeHours = async (req, res) => {
  try {
    const doctorEntityId = req.user?.id; // entities.entity_id
    if (!doctorEntityId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }

    const result = await doctorService.getMyOfficeHours(doctorEntityId);

    if (!result.success) {
      return res.status(400).json({ status: "fail", message: result.message });
    }

    return res.status(200).json({ status: "success", data: result.data });
  } catch (error) {
    console.error("Controller Error in getMyOfficeHours:", error);
    return res.status(500).json({
      status: "error",
      message: "An unexpected error occurred while fetching office hours",
      error: error.message,
    });
  }
};


// POST /doctor/office-hours/:doctorId
const createOfficeHour = async (req, res) => {
  try {
    const doctorEntityId = req.user?.id; // entities.entity_id
    if (!doctorEntityId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }

    const { day, startTime, endTime, location } = req.body;

    if (!day || !startTime || !endTime || !location) {
      return res.status(400).json({
        status: "fail",
        message: "day, startTime, endTime, location are required",
      });
    }

    const result = await doctorService.createOfficeHour(doctorEntityId, {
      day,
      startTime,
      endTime,
      location,
    });

    if (!result.success) {
      return res.status(400).json({ status: "fail", message: result.message });
    }

    return res.status(201).json({
      status: "success",
      message: "Office hour created",
      data: result.data,
    });
  } catch (error) {
    console.error("Controller Error in createOfficeHour:", error);
    return res.status(500).json({
      status: "error",
      message: "An unexpected error occurred while creating office hour",
      error: error.message,
    });
  }
};

// ===================== Meeting Requests =====================
// GET /doctor/meeting-requests/:doctorId
const getMeetingRequests = async (req, res) => {
  try {
    const doctorEntityId = req.user?.id; // entities.entity_id
    if (!doctorEntityId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }

    const result = await doctorService.getMeetingRequests(doctorEntityId);

    if (!result.success) {
      return res.status(400).json({ status: "fail", message: result.message });
    }

    return res.status(200).json({ status: "success", data: result.data });
  } catch (error) {
    console.error("Controller Error in getMeetingRequests:", error);
    return res.status(500).json({
      status: "error",
      message: "An unexpected error occurred while fetching meeting requests",
      error: error.message,
    });
  }
};


// ===================== Approve Meeting Request =====================
const approveMeetingRequest = async (req, res) => {
  try {
    const doctorEntityId = req.user?.id;
    if (!doctorEntityId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "Meeting request id is required" });
    }

    const result = await doctorService.updateMeetingRequestStatus(id, "approved", doctorEntityId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({ success: true, message: "Meeting request approved" });
  } catch (e) {
    console.error("approveMeetingRequest error:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

const rejectMeetingRequest = async (req, res) => {
  try {
    const doctorEntityId = req.user?.id;
    if (!doctorEntityId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "Meeting request id is required" });
    }

    const result = await doctorService.updateMeetingRequestStatus(id, "rejected", doctorEntityId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({ success: true, message: "Meeting request rejected" });
  } catch (e) {
    console.error("rejectMeetingRequest error:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};



module.exports = {
  bookClassroom,
  getDoctorCourses,
  createCourseAssignment,
  getCourseAssignments,
  updateAssignment,
  uploadAssignmentAttachment,
  getCourseStudents,
  getCourseResources,
  uploadCourseResource,
  getCourseStaff,
  getCourseSchedule,
  getDoctorByEmail,
  updateMyDoctorProfile,
  getMyOfficeHours,
  createOfficeHour,
  getMeetingRequests,
  approveMeetingRequest,
  rejectMeetingRequest,
  createCourseQuiz,
  getCourseQuizzes,
  updateQuiz,
};
