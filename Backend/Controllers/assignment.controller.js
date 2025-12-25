const assignmentService = require('../Services/assignment.service');
const pool = require('../Db_config/DB');

// ================= COURSE ASSIGNMENTS CRUD =================

/**
 * Assign staff to a course
 */
const assignStaffToCourse = async (req, res) => {
  try {
    const { courseId, staffId, role, department, notes } = req.body;

    console.log('=== ASSIGNMENT REQUEST DEBUG ===');
    console.log('Full request body:', req.body);
    console.log('Extracted values:', { courseId, staffId, role, department, notes });

    if (!courseId || !staffId || !role) {
      console.log('Validation failed:', {
        courseId_missing: !courseId,
        staffId_missing: !staffId,
        role_missing: !role,
      });
      return res.status(400).json({
        status: 'fail',
        message: 'courseId, staffId, and role are required',
      });
    }

    const result = await assignmentService.assignStaffToCourse({
      courseId,
      staffId,
      role,
      department,
      notes,
    });

    if (!result.success) {
      console.log('Service error:', result.message);
      return res.status(400).json({
        status: 'fail',
        message: result.message,
      });
    }

    console.log('Assignment created successfully:', result.id);
    res.status(201).json({
      status: 'success',
      message: result.message,
      data: {
        assignmentId: result.id,
      },
    });
  } catch (error) {
    console.error('Error assigning staff:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to assign staff to course',
      error: error.message,
    });
  }
};

/**
 * Get all assignments for a course
 */
const getAssignmentsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Course ID is required',
      });
    }

    const result = await assignmentService.getAssignmentsByCourse(courseId);

    if (!result.success) {
      return res.status(400).json({
        status: 'fail',
        message: result.message,
      });
    }

    res.status(200).json({
      status: 'success',
      data: result.data,
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch assignments',
      error: error.message,
    });
  }
};

/**
 * Get all assignments for a staff member
 */
const getAssignmentsByStaff = async (req, res) => {
  try {
    const { staffId } = req.params;

    if (!staffId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Staff ID is required',
      });
    }

    const result = await assignmentService.getAssignmentsByStaff(staffId);

    if (!result.success) {
      return res.status(400).json({
        status: 'fail',
        message: result.message,
      });
    }

    res.status(200).json({
      status: 'success',
      data: result.data,
    });
  } catch (error) {
    console.error('Error fetching staff assignments:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch staff assignments',
      error: error.message,
    });
  }
};

/**
 * Get all assignments with optional filters
 */
const getAllAssignments = async (req, res) => {
  try {
    const filters = {
      courseId: req.query.courseId,
      staffId: req.query.staffId,
      role: req.query.role,
      status: req.query.status,
    };

    const result = await assignmentService.getAllAssignments(filters);

    if (!result.success) {
      return res.status(400).json({
        status: 'fail',
        message: result.message,
      });
    }

    res.status(200).json({
      status: 'success',
      data: result.data,
    });
  } catch (error) {
    console.error('Error fetching all assignments:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch assignments',
      error: error.message,
    });
  }
};

/**
 * Get assignment by ID
 */
const getAssignmentById = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    if (!assignmentId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Assignment ID is required',
      });
    }

    const result = await assignmentService.getAssignmentById(assignmentId);

    if (!result.success) {
      return res.status(404).json({
        status: 'fail',
        message: result.message,
      });
    }

    res.status(200).json({
      status: 'success',
      data: result.data,
    });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch assignment',
      error: error.message,
    });
  }
};

/**
 * Update an assignment
 */
const updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { role, status, notes, department } = req.body;

    if (!assignmentId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Assignment ID is required',
      });
    }

    const result = await assignmentService.updateAssignment(assignmentId, {
      role,
      status,
      notes,
      department,
    });

    if (!result.success) {
      return res.status(400).json({
        status: 'fail',
        message: result.message,
      });
    }

    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update assignment',
      error: error.message,
    });
  }
};

/**
 * Remove an assignment
 */
const removeAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    if (!assignmentId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Assignment ID is required',
      });
    }

    const result = await assignmentService.removeAssignment(assignmentId);

    if (!result.success) {
      return res.status(400).json({
        status: 'fail',
        message: result.message,
      });
    }

    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    console.error('Error removing assignment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove assignment',
      error: error.message,
    });
  }
};

module.exports = {
  assignStaffToCourse,
  getAssignmentsByCourse,
  getAssignmentsByStaff,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  removeAssignment,
};
