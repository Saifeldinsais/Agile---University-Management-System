/**
 * Event Service
 * Frontend API client for events
 */

import { apiClient } from "./apiClient";

const eventService = {
    // Categories
    async getCategories() {
        const response = await apiClient.get('/events/categories');
        return response.data;
    },

    // Get events with filters
    async getEvents(filters = {}) {
        const params = new URLSearchParams();
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.category_id) params.append('category_id', filters.category_id);
        if (filters.status) params.append('status', filters.status);
        if (filters.limit) params.append('limit', filters.limit);

        const url = params.toString() ? `/events?${params}` : '/events';
        const response = await apiClient.get(url);
        return response.data;
    },

    // Get calendar events for month
    async getCalendarEvents(year, month) {
        const response = await apiClient.get(`/events/calendar?year=${year}&month=${month}`);
        return response.data;
    },

    // Get single event
    async getEventById(id) {
        const response = await apiClient.get(`/events/${id}`);
        return response.data;
    },

    // Get event stats
    async getEventStats(id) {
        const response = await apiClient.get(`/events/${id}/stats`);
        return response.data;
    },

    // Create event
    async createEvent(data) {
        const response = await apiClient.post('/events', data);
        return response.data;
    },

    // Update event
    async updateEvent(id, data) {
        const response = await apiClient.put(`/events/${id}`, data);
        return response.data;
    },

    // Delete event
    async deleteEvent(id) {
        const response = await apiClient.delete(`/events/${id}`);
        return response.data;
    },

    // Cancel event
    async cancelEvent(id) {
        const response = await apiClient.put(`/events/${id}/cancel`);
        return response.data;
    },

    // RSVP
    async rsvpEvent(id, status) {
        const response = await apiClient.post(`/events/${id}/rsvp`, { status });
        return response.data;
    },

    // Get RSVPs
    async getEventRsvps(id) {
        const response = await apiClient.get(`/events/${id}/rsvps`);
        return response.data;
    },

    // Check in
    async checkInEvent(id, userId = null) {
        const response = await apiClient.post(`/events/${id}/check-in`, userId ? { user_id: userId } : {});
        return response.data;
    },

    // Check out
    async checkOutEvent(id, userId = null) {
        const response = await apiClient.post(`/events/${id}/check-out`, userId ? { user_id: userId } : {});
        return response.data;
    },

    // Get attendance
    async getEventAttendance(id) {
        const response = await apiClient.get(`/events/${id}/attendance`);
        return response.data;
    },

    // Parent-specific: Get all children's RSVP'd events
    async getChildrenEvents() {
        const response = await apiClient.get('/events/parent/children-events');
        return response.data;
    },

    // Parent-specific: Get specific child's events
    async getChildEvents(childId) {
        const response = await apiClient.get(`/events/parent/child/${childId}/events`);
        return response.data;
    }
};

export default eventService;

