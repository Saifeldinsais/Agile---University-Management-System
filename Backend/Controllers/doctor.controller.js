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
      return res.status(400).json({
        status: "fail",
        message: result.message,
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
    const { doctorId, title, description, dueDate, totalMarks } = req.body;

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
    });

    if (!result.success) {
      return res.status(400).json({
        status: "fail",
        message: result.message,
      });
    }

    return res.status(201).json({
      status: "success",
      message: "Assignment created successfully",
      data: result.data, // { assignmentId }
    });
  } catch (error) {
    console.error("Controller Error in createCourseAssignment:", error);
    return res.status(500).json({
      status: "error",
      message: "An unexpected error occurred while creating assignment",
      error: error.message,
    });
  }
};

// ===================== Get Course Assignments (Doctor) =====================
// GET /doctor/courses/:courseId/assignments
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
      message: "An unexpected error occurred while fetching assignments",
      error: error.message,
    });
  }
};

const updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { doctorId, title, description, dueDate, totalMarks } = req.body;

    if (!doctorId) return res.status(400).json({ status: "fail", message: "doctorId is required" });

    const result = await doctorService.updateCourseAssignment(doctorId, assignmentId, {
      title, description, dueDate, totalMarks
    });

    if (!result.success) return res.status(400).json({ status: "fail", message: result.message });

    return res.status(200).json({ status: "success", message: "Assignment updated" });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message });
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

    const result = await doctorService.getCourseResources(courseId);

    if (!result.success) {
      return res.status(400).json({ status: "fail", message: result.message });
    }

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

    console.log('Upload request received:', { courseId, doctorId, title, file: req.file ? 'yes' : 'no' });

    if (!courseId || !doctorId || !title) {
      return res.status(400).json({
        status: "fail",
        message: `Missing required fields. courseId: ${courseId}, doctorId: ${doctorId}, title: ${title}, file: ${req.file ? 'yes' : 'no'}`,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: "fail",
        message: "No file provided",
      });
    }

    const file = req.file;

    // url served by express.static("/uploads", ...)
    const url = `/uploads/resources/${file.filename}`;

    const result = await doctorService.uploadCourseResource(courseId, doctorId, {
      title,
      description,
      fileName: file.originalname,
      filePath: url,
      fileType: file.mimetype.split('/')[0],
      fileSize: file.size,
    });

    if (!result.success) {
      return res.status(400).json({ status: "fail", message: result.message });
    }

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
};
