const adminService = require("../Services/admin.service");

// ================= COURSES =================

const createCourse = async (req, res) => {
    try {
        const { title, code, description, credits, department } = req.body;
        if (!title || !code || !credits || !department) {
            return res.status(400).json({ message: "Required fields are missing" });
        }

        const result = await adminService.createCourse({ title, code, description, credits, department });

        if (!result.success) {
            return res.status(400).json({ status: "Fail", message: result.message });
        }

        res.status(201).json({
            status: "Success",
            data: result.data,
        });
    } catch (error) {
        res.status(500).json({ status: "Fail", message: error.message || "An error occurred" });
    }
};

const deleteCourse = async (req, res) => {
    try {
        const result = await adminService.deleteCourse(req.params.id);
        if (!result.success) {
            return res.status(404).json({ status: "fail", message: result.message });
        }

        // Return updated list
        const coursesResult = await adminService.getCourses();
        return res.status(200).json({ status: "success", data: coursesResult.data });
    } catch (error) {
        return res.status(400).json({ status: "Fail", message: error.message || "An error occurred" });
    }
};

const updateCourse = async (req, res) => {
    try {
        const result = await adminService.updateCourse(req.params.id, req.body);
        if (!result.success) {
            return res.status(404).json({ status: "fail", message: result.message });
        }
        res.status(200).json({ status: "success", data: result.data });
    } catch (error) {
        return res.status(400).json({ status: "Fail", message: error.message });
    }
};

const getCourses = async (req, res) => {
    try {
        const result = await adminService.getCourses();
        if (!result.success) return res.status(500).json({ status: "error", message: result.message });

        return res.status(200).json({
            status: "success",
            data: result.data,
        });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

module.exports = {
    createCourse,
    deleteCourse,
    updateCourse,
    getCourses
};
