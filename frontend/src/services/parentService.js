/**
 * Parent Service
 * API client for parent portal endpoints
 */

import { apiClient } from "./apiClient";

const parentService = {
    // =====================================================
    // Authentication
    // =====================================================

    async register(data) {
        const response = await apiClient.post("/parent/register", data);
        return response.data;
    },

    async login(email, password) {
        const response = await apiClient.post("/parent/login", { email, password });
        if (response.data.token) {
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));
        }
        return response.data;
    },

    // =====================================================
    // Profile
    // =====================================================

    async getProfile() {
        const response = await apiClient.get("/parent/profile");
        return response.data;
    },

    async updateProfile(data) {
        const response = await apiClient.put("/parent/profile", data);
        return response.data;
    },

    // =====================================================
    // Dashboard
    // =====================================================

    async getDashboard() {
        const response = await apiClient.get("/parent/dashboard");
        return response.data;
    },

    // =====================================================
    // Students
    // =====================================================

    async getStudents() {
        const response = await apiClient.get("/parent/students");
        return response.data;
    },

    async getStudentProgress(studentId) {
        const response = await apiClient.get(`/parent/students/${studentId}/progress`);
        return response.data;
    },

    async getStudentAttendance(studentId, courseId = null) {
        const url = courseId
            ? `/parent/students/${studentId}/attendance?courseId=${courseId}`
            : `/parent/students/${studentId}/attendance`;
        const response = await apiClient.get(url);
        return response.data;
    },

    async getStudentRemarks(studentId) {
        const response = await apiClient.get(`/parent/students/${studentId}/remarks`);
        return response.data;
    },

    // =====================================================
    // Teachers
    // =====================================================

    async getAvailableTeachers() {
        const response = await apiClient.get("/parent/teachers");
        return response.data;
    },

    // =====================================================
    // Messages
    // =====================================================

    async getMessageThreads() {
        const response = await apiClient.get("/parent/messages");
        return response.data;
    },

    async getMessages(teacherId, studentId = null) {
        const url = studentId
            ? `/parent/messages/${teacherId}?studentId=${studentId}`
            : `/parent/messages/${teacherId}`;
        const response = await apiClient.get(url);
        return response.data;
    },

    async sendMessage(teacherId, studentId, subject, message) {
        const response = await apiClient.post(`/parent/messages/${teacherId}`, {
            studentId,
            subject,
            message,
        });
        return response.data;
    },

    // =====================================================
    // Announcements
    // =====================================================

    async getAnnouncements() {
        const response = await apiClient.get("/parent/announcements");
        return response.data;
    },

    async markAnnouncementRead(announcementId) {
        const response = await apiClient.put(`/parent/announcements/${announcementId}/read`);
        return response.data;
    },
};

export default parentService;
