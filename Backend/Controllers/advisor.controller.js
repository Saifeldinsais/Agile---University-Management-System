const advisorService = require("../Services/advisor.service");

// ================= ADVISOR ASSIGNMENT =================

/**
 * Check if current user is an advisor
 */
const checkIsAdvisor = async (req, res) => {
    try {
        const userId = req.params.userId || req.body.userId;

        if (!userId) {
            return res.status(400).json({ status: "fail", message: "userId is required" });
        }

        const result = await advisorService.isAdvisor(Number(userId));

        if (result.success) {
            return res.status(200).json({
                status: "success",
                isAdvisor: result.isAdvisor,
                data: result.data
            });
        }

        return res.status(400).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

/**
 * Get advisor's assigned department
 */
const getAdvisorDepartment = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ status: "fail", message: "userId is required" });
        }

        const result = await advisorService.getAdvisorDepartment(Number(userId));

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

/**
 * Assign advisor to department (admin only in production)
 */
const assignAdvisorToDepartment = async (req, res) => {
    try {
        const { userId, department, assignedBy } = req.body;

        if (!userId || !department) {
            return res.status(400).json({
                status: "fail",
                message: "userId and department are required"
            });
        }

        const result = await advisorService.assignAdvisorToDepartment(
            Number(userId),
            department,
            assignedBy ? Number(assignedBy) : null
        );

        if (result.success) {
            return res.status(201).json({
                status: "success",
                message: result.message,
                assignmentId: result.assignmentId
            });
        }

        return res.status(400).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

/**
 * Remove advisor assignment
 */
const removeAdvisorAssignment = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ status: "fail", message: "userId is required" });
        }

        const result = await advisorService.removeAdvisorAssignment(Number(userId));

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

// ================= DEPARTMENT DATA =================

/**
 * Get courses in advisor's department
 */
const getDepartmentCourses = async (req, res) => {
    try {
        const { userId } = req.params;

        // First get advisor's department
        const deptResult = await advisorService.getAdvisorDepartment(Number(userId));
        if (!deptResult.success) {
            return res.status(404).json({ status: "fail", message: deptResult.message });
        }

        const department = deptResult.data.department;
        const result = await advisorService.getDepartmentCourses(department);

        if (result.success) {
            return res.status(200).json({
                status: "success",
                department: department,
                data: result.data
            });
        }

        return res.status(400).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

/**
 * Get students enrolled in advisor's department courses
 */
const getDepartmentStudents = async (req, res) => {
    try {
        const { userId } = req.params;

        // First get advisor's department
        const deptResult = await advisorService.getAdvisorDepartment(Number(userId));
        if (!deptResult.success) {
            return res.status(404).json({ status: "fail", message: deptResult.message });
        }

        const department = deptResult.data.department;
        const result = await advisorService.getDepartmentStudents(department);

        if (result.success) {
            return res.status(200).json({
                status: "success",
                department: department,
                data: result.data
            });
        }

        return res.status(400).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

/**
 * Get specific student's courses within advisor's department
 */
const getStudentCoursesInDepartment = async (req, res) => {
    try {
        const { userId, studentId } = req.params;

        // First get advisor's department
        const deptResult = await advisorService.getAdvisorDepartment(Number(userId));
        if (!deptResult.success) {
            return res.status(404).json({ status: "fail", message: deptResult.message });
        }

        const department = deptResult.data.department;
        const result = await advisorService.getStudentCoursesInDepartment(
            Number(studentId),
            department
        );

        if (result.success) {
            return res.status(200).json({
                status: "success",
                department: department,
                studentId: Number(studentId),
                data: result.data
            });
        }

        return res.status(400).json({ status: "fail", message: result.message });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

/**
 * Get advisor dashboard statistics
 */
const getDepartmentStats = async (req, res) => {
    try {
        const { userId } = req.params;

        // First get advisor's department
        const deptResult = await advisorService.getAdvisorDepartment(Number(userId));
        if (!deptResult.success) {
            return res.status(404).json({ status: "fail", message: deptResult.message });
        }

        const department = deptResult.data.department;
        const result = await advisorService.getDepartmentStats(department);

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
    checkIsAdvisor,
    getAdvisorDepartment,
    assignAdvisorToDepartment,
    removeAdvisorAssignment,
    getDepartmentCourses,
    getDepartmentStudents,
    getStudentCoursesInDepartment,
    getDepartmentStats
};
