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

module.exports = {
    bookClassroom,
};
