import { apiClient } from './apiClient';

const advisorService = {
    // Check if user is an advisor
    checkIsAdvisor: async (userId) => {
        const res = await apiClient.get(`/advisor/check/${userId}`);
        return res.data;
    },

    // Get advisor's assigned department
    getAdvisorDepartment: async (userId) => {
        const res = await apiClient.get(`/advisor/${userId}/department`);
        return res.data;
    },

    // Assign advisor to department
    assignAdvisorToDepartment: async (userId, department, assignedBy = null) => {
        const res = await apiClient.post('/advisor/assign', { userId, department, assignedBy });
        return res.data;
    },

    // Get department courses
    getDepartmentCourses: async (userId) => {
        const res = await apiClient.get(`/advisor/${userId}/courses`);
        return res.data;
    },

    // Get department students
    getDepartmentStudents: async (userId) => {
        const res = await apiClient.get(`/advisor/${userId}/students`);
        return res.data;
    },

    // Get student's courses in department
    getStudentCourses: async (userId, studentId) => {
        const res = await apiClient.get(`/advisor/${userId}/students/${studentId}/courses`);
        return res.data;
    },

    // Get department statistics
    getDepartmentStats: async (userId) => {
        const res = await apiClient.get(`/advisor/${userId}/stats`);
        return res.data;
    }
};

export default advisorService;
