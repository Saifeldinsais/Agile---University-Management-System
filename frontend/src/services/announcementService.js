/**
 * Announcement Service
 * Frontend API client for announcements
 */

import { apiClient } from "./apiClient";

const announcementService = {
    // Get all announcements for current user
    async getAnnouncements(filters = {}) {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.priority) params.append('priority', filters.priority);
        if (filters.limit) params.append('limit', filters.limit);

        const url = params.toString() ? `/announcements?${params}` : '/announcements';
        const response = await apiClient.get(url);
        return response.data;
    },

    // Get single announcement
    async getAnnouncementById(id) {
        const response = await apiClient.get(`/announcements/${id}`);
        return response.data;
    },

    // Create announcement (admin/doctor)
    async createAnnouncement(data) {
        const response = await apiClient.post('/announcements', data);
        return response.data;
    },

    // Update announcement
    async updateAnnouncement(id, data) {
        const response = await apiClient.put(`/announcements/${id}`, data);
        return response.data;
    },

    // Delete announcement
    async deleteAnnouncement(id) {
        const response = await apiClient.delete(`/announcements/${id}`);
        return response.data;
    },

    // Mark as read
    async markAsRead(id) {
        const response = await apiClient.put(`/announcements/${id}/read`);
        return response.data;
    },

    // Get unread count
    async getUnreadCount() {
        const response = await apiClient.get('/announcements/unread/count');
        return response.data;
    },

    // Toggle pin
    async togglePin(id) {
        const response = await apiClient.put(`/announcements/${id}/pin`);
        return response.data;
    },

    // Archive announcement
    async archiveAnnouncement(id) {
        const response = await apiClient.put(`/announcements/${id}/archive`);
        return response.data;
    }
};

export default announcementService;
