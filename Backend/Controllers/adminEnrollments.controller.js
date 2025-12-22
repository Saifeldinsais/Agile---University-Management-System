const adminEnrollmentsService = require('../Services/adminEnrollments.service');

/**
 * Get all enrollment requests with filters
 * GET /api/admin/enrollments?status=&department=&search=
 */
const getEnrollments = async (req, res) => {
    try {
        const { status, department, search } = req.query;

        const result = await adminEnrollmentsService.getEnrollments({
            status: status || '', // Empty string means all statuses
            department,
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
            data: { enrollments: result.data }
        });
    } catch (error) {
        console.error('Controller error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch enrollments',
            error: error.message
        });
    }
};

/**
 * Get a single enrollment by ID
 * GET /api/admin/enrollments/:id
 */
const getEnrollmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await adminEnrollmentsService.getEnrollmentById(id);

        if (!result.success) {
            return res.status(404).json({
                status: 'fail',
                message: result.message
            });
        }

        res.status(200).json({
            status: 'success',
            data: { enrollment: result.data }
        });
    } catch (error) {
        console.error('Controller error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch enrollment',
            error: error.message
        });
    }
};

/**
 * Assign an advisor to an enrollment
 * PATCH /api/admin/enrollments/:id/assign-advisor
 * Body: { advisorId }
 */
const assignAdvisor = async (req, res) => {
    try {
        const { id } = req.params;
        const { advisorId } = req.body;

        if (!advisorId) {
            return res.status(400).json({
                status: 'fail',
                message: 'advisorId is required'
            });
        }

        const result = await adminEnrollmentsService.assignAdvisor(id, advisorId);

        if (!result.success) {
            return res.status(400).json({
                status: 'fail',
                message: result.message
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
            message: 'Failed to assign advisor',
            error: error.message
        });
    }
};

/**
 * Decide on an enrollment (approve/reject)
 * PATCH /api/admin/enrollments/:id/decide
 * Body: { action: "APPROVE"|"REJECT", note?: string }
 */
const decideEnrollment = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, note } = req.body;

        if (!action) {
            return res.status(400).json({
                status: 'fail',
                message: 'action is required (APPROVE or REJECT)'
            });
        }

        // Get decision maker from JWT token
        const decisionBy = req.user ? { id: req.user.id, role: req.user.role } : null;

        const result = await adminEnrollmentsService.decideEnrollment(id, action, note, decisionBy);

        if (!result.success) {
            return res.status(400).json({
                status: 'fail',
                message: result.message
            });
        }

        // Emit real-time event for both admin and student dashboards
        const io = req.app.get("io");
        if (io) {
            const eventData = {
                enrollmentId: parseInt(id),
                status: result.status,
                action: action.toUpperCase(),
                note: note || null,
                decidedAt: new Date().toISOString()
            };

            // Notify admins
            io.to("admin").emit("enrollment-updated", eventData);
            // Notify students
            io.to("student").emit("enrollment-updated", eventData);
        }

        res.status(200).json({
            status: 'success',
            message: result.message,
            data: { status: result.status }
        });
    } catch (error) {
        console.error('Controller error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to process enrollment decision',
            error: error.message
        });
    }
};

/**
 * Get all departments for filter dropdown
 * GET /api/admin/enrollments/departments
 */
const getDepartments = async (req, res) => {
    try {
        const result = await adminEnrollmentsService.getDepartments();

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
 * Get all advisors (optionally filtered by department)
 * GET /api/admin/enrollments/advisors?department=
 */
const getAdvisors = async (req, res) => {
    try {
        const { department } = req.query;

        const result = await adminEnrollmentsService.getAdvisors(department);

        if (!result.success) {
            return res.status(500).json({
                status: 'error',
                message: result.message
            });
        }

        res.status(200).json({
            status: 'success',
            data: { advisors: result.data }
        });
    } catch (error) {
        console.error('Controller error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch advisors',
            error: error.message
        });
    }
};

module.exports = {
    getEnrollments,
    getEnrollmentById,
    assignAdvisor,
    decideEnrollment,
    getDepartments,
    getAdvisors
};
