import { apiClient } from './apiClient';

const adminEnrollmentsService = {
    /**
     * Get all enrollment requests with optional filters
     * @param {Object} filters - { status, department, search }
     */
    getEnrollments: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.department) params.append('department', filters.department);
        if (filters.search) params.append('search', filters.search);

        const queryString = params.toString();
        const url = `/admin/enrollments${queryString ? `?${queryString}` : ''}`;

        const res = await apiClient.get(url);
        return res.data;
    },

    /**
     * Get a single enrollment by ID
     * @param {string|number} id - Enrollment ID
     */
    getEnrollmentById: async (id) => {
        const res = await apiClient.get(`/admin/enrollments/${id}`);
        return res.data;
    },

    /**
     * Assign an advisor to an enrollment
     * @param {string|number} enrollmentId 
     * @param {string|number} advisorId 
     */
    assignAdvisor: async (enrollmentId, advisorId) => {
        const res = await apiClient.patch(`/admin/enrollments/${enrollmentId}/assign-advisor`, {
            advisorId
        });
        return res.data;
    },

    /**
     * Decide on an enrollment (approve or reject)
     * @param {string|number} enrollmentId 
     * @param {string} action - 'APPROVE' or 'REJECT'
     * @param {string} note - Optional rejection reason
     */
    decideEnrollment: async (enrollmentId, action, note = '') => {
        const res = await apiClient.patch(`/admin/enrollments/${enrollmentId}/decide`, {
            action,
            note
        });
        return res.data;
    },

    /**
     * Get all departments for filter dropdown
     */
    getDepartments: async () => {
        const res = await apiClient.get('/admin/enrollments/departments');
        return res.data;
    },

    /**
     * Get all advisors (optionally filtered by department)
     * @param {string} department - Optional department filter
     */
    getAdvisors: async (department = null) => {
        const url = department
            ? `/admin/enrollments/advisors?department=${encodeURIComponent(department)}`
            : '/admin/enrollments/advisors';
        const res = await apiClient.get(url);
        return res.data;
    }
};

export default adminEnrollmentsService;
