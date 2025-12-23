import { apiClient } from './apiClient';

const assignmentService = {
  /**
   * Assign staff to a course
   */
  assignStaffToCourse: async (courseId, staffId, role, department = '', notes = '') => {
    const res = await apiClient.post('/admin/assignments', {
      courseId,
      staffId,
      role,
      department,
      notes,
    });
    return res.data;
  },

  /**
   * Get all assignments for a specific course
   */
  getAssignmentsByCourse: async (courseId) => {
    const res = await apiClient.get(`/admin/assignments/course/${courseId}`);
    return res.data;
  },

  /**
   * Get all assignments for a specific staff member
   */
  getAssignmentsByStaff: async (staffId) => {
    const res = await apiClient.get(`/admin/assignments/staff/${staffId}`);
    return res.data;
  },

  /**
   * Get all assignments with optional filters
   */
  getAllAssignments: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.courseId) params.append('courseId', filters.courseId);
    if (filters.staffId) params.append('staffId', filters.staffId);
    if (filters.role) params.append('role', filters.role);
    if (filters.status) params.append('status', filters.status);

    const queryString = params.toString();
    const url = `/admin/assignments${queryString ? `?${queryString}` : ''}`;

    const res = await apiClient.get(url);
    return res.data;
  },

  /**
   * Get single assignment by ID
   */
  getAssignmentById: async (assignmentId) => {
    const res = await apiClient.get(`/admin/assignments/${assignmentId}`);
    return res.data;
  },

  /**
   * Update an assignment
   */
  updateAssignment: async (assignmentId, { role, status, notes, department }) => {
    const res = await apiClient.patch(`/admin/assignments/${assignmentId}`, {
      role,
      status,
      notes,
      department,
    });
    return res.data;
  },

  /**
   * Remove an assignment
   */
  removeAssignment: async (assignmentId) => {
    const res = await apiClient.delete(`/admin/assignments/${assignmentId}`);
    return res.data;
  },
};

export default assignmentService;
