import { apiClient } from './apiClient';

const staffService = {
    // Get or create staff profile by email (links user to staff profile)
    getOrCreateByEmail: async (email, name, type = 'ta') => {
        const res = await apiClient.post('/staff/get-by-email', { email, name, type });
        return res.data;
    },

    // Get all staff
    getAllStaff: async (type = null) => {
        const url = type ? `/staff?type=${type}` : '/staff';
        const res = await apiClient.get(url);
        return res.data;
    },

    // Get staff by ID
    getStaffById: async (id) => {
        const res = await apiClient.get(`/staff/${id}`);
        return res.data;
    },

    // Update staff profile
    updateStaffProfile: async (id, data) => {
        const res = await apiClient.patch(`/staff/${id}`, data);
        return res.data;
    },

    // ================= OFFICE HOURS =================
    getOfficeHours: async (id) => {
        const res = await apiClient.get(`/staff/${id}/office-hours`);
        return res.data;
    },

    updateOfficeHours: async (id, officeHours) => {
        const res = await apiClient.patch(`/staff/${id}/office-hours`, { officeHours });
        return res.data;
    },

    // ================= COURSES =================
    getAssignedCourses: async (id) => {
        const res = await apiClient.get(`/staff/${id}/courses`);
        return res.data;
    },

    // ================= TA RESPONSIBILITIES =================
    getTAResponsibilities: async (id) => {
        const res = await apiClient.get(`/staff/ta/${id}/responsibilities`);
        return res.data;
    },

    updateTAResponsibilities: async (id, responsibilities) => {
        const res = await apiClient.patch(`/staff/ta/${id}/responsibilities`, { responsibilities });
        return res.data;
    },

    // ================= PERFORMANCE =================
    getPerformanceRecords: async (id) => {
        const res = await apiClient.get(`/staff/${id}/performance`);
        return res.data;
    },

    addPerformanceRecord: async (id, record) => {
        const res = await apiClient.post(`/staff/${id}/performance`, record);
        return res.data;
    },

    // ================= RESEARCH =================
    getResearchPublications: async (id) => {
        const res = await apiClient.get(`/staff/${id}/research`);
        return res.data;
    },

    addResearchPublication: async (id, publication) => {
        const res = await apiClient.post(`/staff/${id}/research`, publication);
        return res.data;
    },

    // ================= PROFESSIONAL DEVELOPMENT =================
    getProfessionalDevelopment: async (id) => {
        const res = await apiClient.get(`/staff/${id}/professional-development`);
        return res.data;
    },

    addProfessionalDevelopment: async (id, activity) => {
        const res = await apiClient.post(`/staff/${id}/professional-development`, activity);
        return res.data;
    },

    // ================= HR / PAYROLL =================
    getPayrollInfo: async (id) => {
        const res = await apiClient.get(`/staff/${id}/payroll`);
        return res.data;
    },

    getBenefits: async (id) => {
        const res = await apiClient.get(`/staff/${id}/benefits`);
        return res.data;
    },

    // ================= LEAVE REQUESTS =================
    getLeaveRequests: async (id) => {
        const res = await apiClient.get(`/staff/${id}/leave-requests`);
        return res.data;
    },

    createLeaveRequest: async (id, leaveData) => {
        const res = await apiClient.post(`/staff/${id}/leave-requests`, leaveData);
        return res.data;
    },

    getLeaveBalance: async (id) => {
        const res = await apiClient.get(`/staff/${id}/leave-balance`);
        return res.data;
    }
};

export default staffService;
