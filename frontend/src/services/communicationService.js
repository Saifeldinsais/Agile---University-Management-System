/**
 * Communication Service
 * Frontend API client for Student-Staff Communication
 */

import { apiClient } from "./apiClient";

const communicationService = {
    // =====================================================
    // Conversations
    // =====================================================

    async getConversations() {
        const response = await apiClient.get("/communication/conversations");
        return response.data;
    },

    async createConversation(staffId, staffType, subject) {
        const response = await apiClient.post("/communication/conversations", {
            staffId,
            staffType,
            subject
        });
        return response.data;
    },

    async getMessages(conversationId) {
        const response = await apiClient.get(`/communication/conversations/${conversationId}/messages`);
        return response.data;
    },

    async sendMessage(conversationId, message) {
        const response = await apiClient.post(`/communication/conversations/${conversationId}/messages`, {
            message
        });
        return response.data;
    },

    async getUnreadCount() {
        const response = await apiClient.get("/communication/unread");
        return response.data;
    },

    // =====================================================
    // Meeting Requests
    // =====================================================

    async getMeetingRequests(status = null) {
        const url = status
            ? `/communication/meetings?status=${status}`
            : "/communication/meetings";
        const response = await apiClient.get(url);
        return response.data;
    },

    async createMeetingRequest(data) {
        const response = await apiClient.post("/communication/meetings", data);
        return response.data;
    },

    async updateMeetingRequest(requestId, data) {
        const response = await apiClient.put(`/communication/meetings/${requestId}`, data);
        return response.data;
    },

    async cancelMeetingRequest(requestId) {
        const response = await apiClient.delete(`/communication/meetings/${requestId}`);
        return response.data;
    },

    // =====================================================
    // Academic Guidance
    // =====================================================

    async getGuidance() {
        const response = await apiClient.get("/communication/guidance");
        return response.data;
    },

    async createGuidance(data) {
        const response = await apiClient.post("/communication/guidance", data);
        return response.data;
    },

    async markGuidanceRead(guidanceId) {
        const response = await apiClient.put(`/communication/guidance/${guidanceId}/read`);
        return response.data;
    },

    // =====================================================
    // Staff Lookup
    // =====================================================

    async getAvailableStaff(type = null) {
        const url = type
            ? `/communication/staff?type=${type}`
            : "/communication/staff";
        const response = await apiClient.get(url);
        return response.data;
    }
};

export default communicationService;
