const doctorService = require("../Services/doctor.service");

const bookClassroom = async (req, res) => {
    try {
        const { doctorId, classroomId, slotId } = req.body;


        if (!classroomId || !slotId || !doctorId) {
            return res.status(400).json({ 
                status: "fail",
                message: "doctorId, classroomId, and slotId (the specific ID of the timeslot) are required" 
            });
        }


        const result = await doctorService.bookClassroomRequest(classroomId, slotId, doctorId);

        if (!result.success) {
            return res.status(400).json({ 
                status: "fail",
                message: result.message 
            });
        }


        res.status(200).json({ 
            status: "success",
            message: result.message 
        });

    } catch (error) {
        console.error("Controller Error in bookClassroom:", error);
        res.status(500).json({ 
            status: "error",
            message: "An unexpected error occurred while processing the booking request",
            error: error.message 
        });
    }
};


const uploadAssignment = async (req, res) => {
  try {

    const courseId = parseInt(req.params.courseId, 10);
    if (isNaN(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID"
      });
    }
    const assignmentData = {
      title: req.body.title?.trim(),
      description: req.body.description?.trim(),
      dueDate: req.body.dueDate || null,           // e.g., "2025-12-25T23:59:00Z"
      fileUrl: req.body.fileUrl || null,           // optional: link to uploaded file
      maxPoints: req.body.maxPoints ? Number(req.body.maxPoints) : null
    };

    // Basic validation
    if (!assignmentData.title) {
      return res.status(400).json({
        success: false,
        message: "Assignment title is required"
      });
    }

    // 3. Get the authenticated doctor's entity_id
    // Assuming you have authentication middleware that sets req.user
    // and req.user.entityId is the doctor's entity_id from the `entities` table
    const {uploadedByDoctorId} = req.body;

    if (!uploadedByDoctorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required: Doctor ID not found"
      });
    }

    // 4. Call the service
    const result = await doctorService.uploadAssignment(
      courseId,
      assignmentData,
      uploadedByDoctorId
    );

    // 5. Respond based on service result
    if (!result.success) {
      // Authorization or not found errors → 403 or 404
      const statusCode = result.message.includes("Unauthorized")
        ? 403
        : result.message.includes("not found")
        ? 404
        : 400;

      return res.status(statusCode).json({
        success: false,
        message: result.message
      });
    }

    // Success
    return res.status(201).json({
      success: true,
      message: result.message,
      data: result.data
    });

  } catch (error) {
    console.error("Unexpected error in uploadAssignment controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = {
    bookClassroom,uploadAssignment
};
