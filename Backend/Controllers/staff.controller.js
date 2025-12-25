const staffService = require("../Services/staff.service");

// ================= STAFF DIRECTORY =================

const getAllStaff = async (req, res) => {
    try {
        const { type } = req.query;

        let result;
        if (type && ['professor', 'ta'].includes(type)) {
            result = await staffService.getStaffByType(type);
        } else {
            result = await staffService.getAllStaff();
        }

        if (result.success) {
            return res.status(200).json({
                status: "success",
                data: result.data
            });
        }
        return res.status(400).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

const getStaffById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await staffService.getStaffById(Number(id));

        if (result.success) {
            return res.status(200).json({
                status: "success",
                data: result.data
            });
        }
        return res.status(404).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

const createStaffProfile = async (req, res) => {
    try {
        const { name, type, email, phone, department, officeLocation, supervisorId } = req.body;

        if (!name || !type || !email) {
            return res.status(400).json({
                status: "fail",
                message: "Name, type, and email are required"
            });
        }

        const result = await staffService.createStaffProfile({
            name, type, email, phone, department, officeLocation, supervisorId
        });

        if (result.success) {
            return res.status(201).json({
                status: "success",
                message: result.message,
                staffId: result.staffId
            });
        }
        return res.status(400).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

const updateStaffProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const result = await staffService.updateStaffProfile(Number(id), updateData);

        if (result.success) {
            return res.status(200).json({
                status: "success",
                message: result.message
            });
        }
        return res.status(404).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

const deleteStaffProfile = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await staffService.deleteStaffProfile(Number(id));

        if (result.success) {
            return res.status(200).json({
                status: "success",
                message: result.message
            });
        }
        return res.status(404).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

// ================= OFFICE HOURS =================

const getOfficeHours = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await staffService.getOfficeHours(Number(id));

        if (result.success) {
            return res.status(200).json({
                status: "success",
                data: result.data
            });
        }
        return res.status(404).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

const updateOfficeHours = async (req, res) => {
    try {
        const { id } = req.params;
        const { officeHours } = req.body;

        if (!officeHours || !Array.isArray(officeHours)) {
            return res.status(400).json({
                status: "fail",
                message: "officeHours array is required"
            });
        }

        const result = await staffService.updateOfficeHours(Number(id), officeHours);

        if (result.success) {
            return res.status(200).json({
                status: "success",
                message: result.message
            });
        }
        return res.status(404).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

// ================= COURSES =================

const getAssignedCourses = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await staffService.getAssignedCourses(Number(id));

        if (result.success) {
            return res.status(200).json({
                status: "success",
                data: result.data
            });
        }
        return res.status(404).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

const assignCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { courseId } = req.body;

        if (!courseId) {
            return res.status(400).json({
                status: "fail",
                message: "courseId is required"
            });
        }

        const result = await staffService.assignCourseToStaff(Number(id), Number(courseId));

        if (result.success) {
            return res.status(200).json({
                status: "success",
                message: result.message
            });
        }
        return res.status(400).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

// ================= TA MANAGEMENT =================

const getTAResponsibilities = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await staffService.getTAResponsibilities(Number(id));

        if (result.success) {
            return res.status(200).json({
                status: "success",
                data: result.data
            });
        }
        return res.status(404).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

const updateTAResponsibilities = async (req, res) => {
    try {
        const { id } = req.params;
        const { responsibilities } = req.body;

        if (!responsibilities || !Array.isArray(responsibilities)) {
            return res.status(400).json({
                status: "fail",
                message: "responsibilities array is required"
            });
        }

        const result = await staffService.updateTAResponsibilities(Number(id), responsibilities);

        if (result.success) {
            return res.status(200).json({
                status: "success",
                message: result.message
            });
        }
        return res.status(400).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

// ================= PERFORMANCE =================

const getPerformanceRecords = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await staffService.getPerformanceRecords(Number(id));

        if (result.success) {
            return res.status(200).json({
                status: "success",
                data: result.data
            });
        }
        return res.status(404).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

const addPerformanceRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const record = req.body;

        if (!record.title || !record.rating) {
            return res.status(400).json({
                status: "fail",
                message: "title and rating are required for performance record"
            });
        }

        const result = await staffService.addPerformanceRecord(Number(id), record);

        if (result.success) {
            return res.status(201).json({
                status: "success",
                message: result.message,
                recordId: result.recordId
            });
        }
        return res.status(400).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

const getResearchPublications = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await staffService.getResearchPublications(Number(id));

        if (result.success) {
            return res.status(200).json({
                status: "success",
                data: result.data
            });
        }
        return res.status(404).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

const addResearchPublication = async (req, res) => {
    try {
        const { id } = req.params;
        const publication = req.body;

        if (!publication.title) {
            return res.status(400).json({
                status: "fail",
                message: "title is required for research publication"
            });
        }

        const result = await staffService.addResearchPublication(Number(id), publication);

        if (result.success) {
            return res.status(201).json({
                status: "success",
                message: result.message,
                publicationId: result.publicationId
            });
        }
        return res.status(400).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

// ================= HR / PAYROLL =================

const getPayrollInfo = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await staffService.getPayrollInfo(Number(id));

        if (result.success) {
            return res.status(200).json({
                status: "success",
                data: result.data
            });
        }
        return res.status(404).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

const updatePayrollInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const payrollData = req.body;

        const result = await staffService.updatePayrollInfo(Number(id), payrollData);

        if (result.success) {
            return res.status(200).json({
                status: "success",
                message: result.message
            });
        }
        return res.status(404).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

const getBenefits = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await staffService.getBenefits(Number(id));

        if (result.success) {
            return res.status(200).json({
                status: "success",
                data: result.data
            });
        }
        return res.status(404).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

// ================= LEAVE REQUESTS =================

const getLeaveRequests = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await staffService.getLeaveRequests(Number(id));

        if (result.success) {
            return res.status(200).json({
                status: "success",
                data: result.data
            });
        }
        return res.status(404).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

const getAllLeaveRequests = async (req, res) => {
    try {
        const { status } = req.query;

        const result = await staffService.getAllLeaveRequests(status);

        if (result.success) {
            return res.status(200).json({
                status: "success",
                data: result.data
            });
        }
        return res.status(400).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

const createLeaveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { leaveType, startDate, endDate, reason } = req.body;

        if (!leaveType || !startDate || !endDate) {
            return res.status(400).json({
                status: "fail",
                message: "leaveType, startDate, and endDate are required"
            });
        }

        const result = await staffService.createLeaveRequest(Number(id), {
            leaveType, startDate, endDate, reason
        });

        if (result.success) {
            return res.status(201).json({
                status: "success",
                message: result.message,
                requestId: result.requestId
            });
        }
        return res.status(400).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

const updateLeaveRequestStatus = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status, reviewedBy } = req.body;

        if (!status) {
            return res.status(400).json({
                status: "fail",
                message: "status is required (approved or rejected)"
            });
        }

        const result = await staffService.updateLeaveRequestStatus(
            Number(requestId),
            status,
            reviewedBy
        );

        if (result.success) {
            return res.status(200).json({
                status: "success",
                message: result.message
            });
        }
        return res.status(400).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

const getLeaveBalance = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await staffService.getLeaveBalance(Number(id));

        if (result.success) {
            return res.status(200).json({
                status: "success",
                data: result.data
            });
        }
        return res.status(404).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

// ================= PROFESSIONAL DEVELOPMENT =================

const getProfessionalDevelopment = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await staffService.getProfessionalDevelopment(Number(id));

        if (result.success) {
            return res.status(200).json({
                status: "success",
                data: result.data
            });
        }
        return res.status(404).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

const addProfessionalDevelopment = async (req, res) => {
    try {
        const { id } = req.params;
        const activity = req.body;

        if (!activity.title) {
            return res.status(400).json({
                status: "fail",
                message: "title is required for professional development activity"
            });
        }

        const result = await staffService.addProfessionalDevelopment(Number(id), activity);

        if (result.success) {
            return res.status(201).json({
                status: "success",
                message: result.message,
                activityId: result.activityId
            });
        }
        return res.status(400).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

// ================= USER-STAFF LINKING =================

const getOrCreateByEmail = async (req, res) => {
    try {
        const { email, name, type } = req.body;

        if (!email) {
            return res.status(400).json({
                status: "fail",
                message: "email is required"
            });
        }

        const result = await staffService.getOrCreateByEmail(email, name, type || 'ta');

        if (result.success) {
            return res.status(200).json({
                status: "success",
                data: result.data
            });
        }
        return res.status(400).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

module.exports = {
    // Staff Directory
    getAllStaff,
    getStaffById,
    createStaffProfile,
    updateStaffProfile,
    deleteStaffProfile,

    // Office Hours
    getOfficeHours,
    updateOfficeHours,

    // Courses
    getAssignedCourses,
    assignCourse,

    // TA Management
    getTAResponsibilities,
    updateTAResponsibilities,

    // Performance
    getPerformanceRecords,
    addPerformanceRecord,
    getResearchPublications,
    addResearchPublication,

    // Professional Development
    getProfessionalDevelopment,
    addProfessionalDevelopment,

    // HR / Payroll
    getPayrollInfo,
    updatePayrollInfo,
    getBenefits,

    // Leave Requests
    getLeaveRequests,
    getAllLeaveRequests,
    createLeaveRequest,
    updateLeaveRequestStatus,
    getLeaveBalance,

    // User-Staff Linking
    getOrCreateByEmail
};

