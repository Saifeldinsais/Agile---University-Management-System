import { apiClient } from './apiClient';

const adminStaffService = {
    /**
     * Get all staff members with optional filters
     * @param {Object} filters - { role, department, status, search }
     */
    getStaff: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.role) params.append('role', filters.role);
        if (filters.department) params.append('department', filters.department);
        if (filters.status) params.append('status', filters.status);
        if (filters.search) params.append('search', filters.search);

        const queryString = params.toString();
        const url = `/admin/staff${queryString ? `?${queryString}` : ''}`;

        const res = await apiClient.get(url);
        return res.data;
    },

    /**
     * Get a single staff member by ID
     * @param {string|number} id - Staff ID
     */
    getStaffById: async (id) => {
        const res = await apiClient.get(`/admin/staff/${id}`);
        return res.data;
    },

    /**
     * Create a new staff member
     * @param {Object} staffData - Staff member data
     */
    createStaff: async (staffData) => {
        const res = await apiClient.post('/admin/staff', staffData);
        return res.data;
    },

    /**
     * Update a staff member
     * @param {string|number} id - Staff ID
     * @param {Object} staffData - Updated staff data
     */
    updateStaff: async (id, staffData) => {
        const res = await apiClient.patch(`/admin/staff/${id}`, staffData);
        return res.data;
    },

    /**
     * Toggle staff status (activate/deactivate)
     * @param {string|number} id - Staff ID
     */
    toggleStaffStatus: async (id) => {
        const res = await apiClient.patch(`/admin/staff/${id}/toggle-status`);
        return res.data;
    },

    /**
     * Delete a staff member
     * @param {string|number} id - Staff ID
     */
    deleteStaff: async (id) => {
        const res = await apiClient.delete(`/admin/staff/${id}`);
        return res.data;
    },

    /**
     * Get all departments for filter dropdown
     */
    getDepartments: async () => {
        const res = await apiClient.get('/admin/staff/departments');
        return res.data;
    },

    /**
     * Get staff statistics
     */
    getStats: async () => {
        const res = await apiClient.get('/admin/staff/stats');
        return res.data;
    },

    // ============ Staff Account Management (Auth-related) ============

    /**
     * Create a staff account with user authentication
     * This creates both the staff profile AND a login account with temp password
     * @param {Object} accountData - { email, username, userType, department, ... }
     * @returns {Object} - { userId, temporaryPassword }
     */
    createStaffAccount: async (accountData) => {
        const res = await apiClient.post('/auth/admin/staff', accountData);
        return res.data;
    },

    /**
     * Reset a staff member's password (admin action)
     * @param {string|number} staffUserId - User ID of the staff member
     * @returns {Object} - { temporaryPassword }
     */
    resetStaffPassword: async (staffUserId) => {
        const res = await apiClient.post(`/auth/admin/staff/${staffUserId}/reset-password`);
        return res.data;
    },

    /**
     * Update staff account status (active/inactive/pending)
     * @param {string|number} staffUserId - User ID of the staff member
     * @param {string} status - 'active', 'inactive', or 'pending'
     */
    updateStaffAccountStatus: async (staffUserId, status) => {
        const res = await apiClient.patch(`/auth/admin/staff/${staffUserId}/status`, { status });
        return res.data;
    }
};

export default adminStaffService;

