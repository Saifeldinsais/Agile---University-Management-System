/**
 * Parent Controller
 * HTTP request handlers for the Parent-Teacher Portal
 */

const parentService = require('../Services/parent.service');

const parentController = {
    // =====================================================
    // Authentication & Profile
    // =====================================================

    /**
     * Register a new parent
     * POST /api/parent/register
     */
    async register(req, res) {
        try {
            const result = await parentService.createParent(req.body);
            res.status(201).json({
                success: true,
                message: 'Parent account created successfully',
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Parent login
     * POST /api/parent/login
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const parent = await parentService.authenticateParent(email, password);

            // Generate JWT token (using existing auth pattern)
            const jwt = require('jsonwebtoken');
            const token = jwt.sign(
                {
                    entity_id: parent.entity_id,
                    entity_type: 'parent',
                    email: parent.email
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                message: 'Login successful',
                token,
                user: parent
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Get own profile
     * GET /api/parent/profile
     */
    async getProfile(req, res) {
        try {
            const parentId = req.user.entity_id;
            const profile = await parentService.getParentProfile(parentId);
            res.json({
                success: true,
                data: profile
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Update own profile
     * PUT /api/parent/profile
     */
    async updateProfile(req, res) {
        try {
            const parentId = req.user.entity_id;
            const profile = await parentService.updateParentProfile(parentId, req.body);
            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: profile
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // =====================================================
    // Students
    // =====================================================

    /**
     * Get linked students
     * GET /api/parent/students
     */
    async getStudents(req, res) {
        try {
            const parentId = req.user.entity_id;
            const students = await parentService.getLinkedStudents(parentId);
            res.json({
                success: true,
                data: students
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Get student progress (grades, GPA)
     * GET /api/parent/students/:studentId/progress
     */
    async getStudentProgress(req, res) {
        try {
            const parentId = req.user.entity_id;
            const { studentId } = req.params;
            const progress = await parentService.getStudentProgress(parentId, parseInt(studentId));
            res.json({
                success: true,
                data: progress
            });
        } catch (error) {
            res.status(error.message.includes('not authorized') ? 403 : 400).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Get student attendance
     * GET /api/parent/students/:studentId/attendance
     */
    async getStudentAttendance(req, res) {
        try {
            const parentId = req.user.entity_id;
            const { studentId } = req.params;
            const { courseId } = req.query;
            const attendance = await parentService.getStudentAttendance(
                parentId,
                parseInt(studentId),
                courseId ? parseInt(courseId) : null
            );
            res.json({
                success: true,
                data: attendance
            });
        } catch (error) {
            res.status(error.message.includes('not authorized') ? 403 : 400).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Get student remarks
     * GET /api/parent/students/:studentId/remarks
     */
    async getStudentRemarks(req, res) {
        try {
            const parentId = req.user.entity_id;
            const { studentId } = req.params;
            const remarks = await parentService.getStudentRemarks(parentId, parseInt(studentId));
            res.json({
                success: true,
                data: remarks
            });
        } catch (error) {
            res.status(error.message.includes('not authorized') ? 403 : 400).json({
                success: false,
                message: error.message
            });
        }
    },

    // =====================================================
    // Messaging
    // =====================================================

    /**
     * Get all message threads
     * GET /api/parent/messages
     */
    async getMessageThreads(req, res) {
        try {
            const parentId = req.user.entity_id;
            const threads = await parentService.getMessageThreads(parentId);
            res.json({
                success: true,
                data: threads
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Get messages with a specific teacher
     * GET /api/parent/messages/:teacherId
     */
    async getMessages(req, res) {
        try {
            const parentId = req.user.entity_id;
            const { teacherId } = req.params;
            const { studentId } = req.query;
            const messages = await parentService.getMessages(
                parentId,
                parseInt(teacherId),
                studentId ? parseInt(studentId) : null
            );
            res.json({
                success: true,
                data: messages
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Send message to a teacher
     * POST /api/parent/messages/:teacherId
     */
    async sendMessage(req, res) {
        try {
            const parentId = req.user.entity_id;
            const { teacherId } = req.params;
            const { studentId, subject, message } = req.body;

            if (!studentId || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'studentId and message are required'
                });
            }

            const result = await parentService.sendMessage(
                parentId,
                parseInt(teacherId),
                parseInt(studentId),
                subject || 'No Subject',
                message
            );

            // Emit socket event for real-time notification
            const io = req.app.get('io');
            if (io) {
                io.to(`teacher-${teacherId}`).emit('new-message', {
                    from: 'parent',
                    parentId,
                    messageId: result.messageId
                });
            }

            res.status(201).json({
                success: true,
                message: 'Message sent successfully',
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Get available teachers (from linked students' courses)
     * GET /api/parent/teachers
     */
    async getAvailableTeachers(req, res) {
        try {
            const parentId = req.user.entity_id;
            const teachers = await parentService.getAvailableTeachers(parentId);
            res.json({
                success: true,
                data: teachers
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // =====================================================
    // Announcements
    // =====================================================

    /**
     * Get all announcements
     * GET /api/parent/announcements
     */
    async getAnnouncements(req, res) {
        try {
            const parentId = req.user.entity_id;
            const announcements = await parentService.getAnnouncements(parentId);
            res.json({
                success: true,
                data: announcements
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Mark announcement as read
     * PUT /api/parent/announcements/:announcementId/read
     */
    async markAnnouncementRead(req, res) {
        try {
            const parentId = req.user.entity_id;
            const { announcementId } = req.params;
            await parentService.markAnnouncementRead(parentId, parseInt(announcementId));
            res.json({
                success: true,
                message: 'Announcement marked as read'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // =====================================================
    // Dashboard
    // =====================================================

    /**
     * Get dashboard overview
     * GET /api/parent/dashboard
     */
    async getDashboard(req, res) {
        try {
            const parentId = req.user.entity_id;
            const overview = await parentService.getDashboardOverview(parentId);
            res.json({
                success: true,
                data: overview
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = parentController;
