const adminStaffService = require('../Services/adminStaff.service');

/**
 * Get all staff members with filters
 * GET /api/admin/staff?role=&department=&status=&search=
 */
const getStaff = async (req, res) => {
    try {
        const { role, department, status, search } = req.query;

        const result = await adminStaffService.getStaff({
            role,
            department,
            status,
            search
        });

        if (!result.success) {
            return res.status(500).json({
                status: 'error',
                message: result.message
            });
        }

        res.status(200).json({
            status: 'success',
            results: result.data.length,
            data: { staff: result.data }
        });
    } catch (error) {
        console.error('Controller error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch staff',
            error: error.message
        });
    }
};

/**
 * Get a single staff member by ID
 * GET /api/admin/staff/:id
 */
const getStaffById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await adminStaffService.getStaffById(id);

        if (!result.success) {
            return res.status(404).json({
                status: 'fail',
                message: result.message
            });
        }

        res.status(200).json({
            status: 'success',
            data: { staff: result.data }
        });
    } catch (error) {
        console.error('Controller error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch staff member',
            error: error.message
        });
    }
};

/**
 * Create a new staff member
 * POST /api/admin/staff
 * Body: { name, email, role, roles, department, officeLocation, phone, status, hireDate, specialization, bio }
 */
const createStaff = async (req, res) => {
    try {
        const staffData = req.body;

        if (!staffData.name || !staffData.email) {
            return res.status(400).json({
                status: 'fail',
                message: 'Name and email are required'
            });
        }

        const result = await adminStaffService.createStaff(staffData);

        if (!result.success) {
            return res.status(400).json({
                status: 'fail',
                message: result.message
            });
        }

        // Emit real-time event
        const io = req.app.get("io");
        if (io) {
            io.to("admin").emit("staff-created", {
                staffId: result.data.id,
                name: staffData.name,
                role: staffData.role,
                createdAt: new Date().toISOString()
            });
        }

        res.status(201).json({
            status: 'success',
            message: result.message,
            data: result.data
        });
    } catch (error) {
        console.error('Controller error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create staff member',
            error: error.message
        });
    }
};

/**
 * Update a staff member
 * PATCH /api/admin/staff/:id
 */
const updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const staffData = req.body;

        const result = await adminStaffService.updateStaff(id, staffData);

        if (!result.success) {
            return res.status(400).json({
                status: 'fail',
                message: result.message
            });
        }

        // Emit real-time event
        const io = req.app.get("io");
        if (io) {
            io.to("admin").emit("staff-updated", {
                staffId: parseInt(id),
                updatedAt: new Date().toISOString()
            });
        }

        res.status(200).json({
            status: 'success',
            message: result.message
        });
    } catch (error) {
        console.error('Controller error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update staff member',
            error: error.message
        });
    }
};

/**
 * Toggle staff status (activate/deactivate)
 * PATCH /api/admin/staff/:id/toggle-status
 */
const toggleStaffStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await adminStaffService.toggleStaffStatus(id);

        if (!result.success) {
            return res.status(400).json({
                status: 'fail',
                message: result.message
            });
        }

        // Emit real-time event
        const io = req.app.get("io");
        if (io) {
            io.to("admin").emit("staff-status-changed", {
                staffId: parseInt(id),
                status: result.data.status,
                updatedAt: new Date().toISOString()
            });
        }

        res.status(200).json({
            status: 'success',
            message: result.message,
            data: result.data
        });
    } catch (error) {
        console.error('Controller error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to toggle staff status',
            error: error.message
        });
    }
};

/**
 * Delete a staff member
 * DELETE /api/admin/staff/:id
 */
const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await adminStaffService.deleteStaff(id);

        if (!result.success) {
            return res.status(400).json({
                status: 'fail',
                message: result.message
            });
        }

        // Emit real-time event
        const io = req.app.get("io");
        if (io) {
            io.to("admin").emit("staff-deleted", {
                staffId: parseInt(id),
                deletedAt: new Date().toISOString()
            });
        }

        res.status(200).json({
            status: 'success',
            message: result.message
        });
    } catch (error) {
        console.error('Controller error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete staff member',
            error: error.message
        });
    }
};

/**
 * Get all departments for filter dropdown
 * GET /api/admin/staff/departments
 */
const getDepartments = async (req, res) => {
    try {
        const result = await adminStaffService.getDepartments();

        if (!result.success) {
            return res.status(500).json({
                status: 'error',
                message: result.message
            });
        }

        res.status(200).json({
            status: 'success',
            data: { departments: result.data }
        });
    } catch (error) {
        console.error('Controller error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch departments',
            error: error.message
        });
    }
};

/**
 * Get staff statistics
 * GET /api/admin/staff/stats
 */
const getStats = async (req, res) => {
    try {
        const result = await adminStaffService.getStats();

        if (!result.success) {
            return res.status(500).json({
                status: 'error',
                message: result.message
            });
        }

        res.status(200).json({
            status: 'success',
            data: result.data
        });
    } catch (error) {
        console.error('Controller error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch staff statistics',
            error: error.message
        });
    }
};

module.exports = {
    getStaff,
    getStaffById,
    createStaff,
    updateStaff,
    toggleStaffStatus,
    deleteStaff,
    getDepartments,
    getStats
};
