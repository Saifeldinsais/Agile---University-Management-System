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

module.exports = {
  bookClassroom,
  getDoctorCourses,
};
