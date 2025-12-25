import { useState, useEffect } from "react";
import communicationService from "../../services/communicationService";
import "./Communication.css";

function MeetingRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [showNewRequest, setShowNewRequest] = useState(false);
    const [staffList, setStaffList] = useState([]);
    const [formData, setFormData] = useState({
        staffId: "",
        staffType: "doctor",
        purpose: "",
        proposed_date: "",
        proposed_time: "",
        duration_minutes: 30
    });

    useEffect(() => {
        loadRequests();
        loadStaff();
    }, [filter]);

    const loadRequests = async () => {
        try {
            const status = filter === "all" ? null : filter;
            const response = await communicationService.getMeetingRequests(status);
            setRequests(response.data || []);
        } catch (error) {
            console.error("Error loading requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadStaff = async () => {
        try {
            const response = await communicationService.getAvailableStaff();
            setStaffList(response.data || []);
        } catch (error) {
            console.error("Error loading staff:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await communicationService.createMeetingRequest(formData);
            setShowNewRequest(false);
            setFormData({
                staffId: "",
                staffType: "doctor",
                purpose: "",
                proposed_date: "",
                proposed_time: "",
                duration_minutes: 30
            });
            loadRequests();
        } catch (error) {
            console.error("Error creating request:", error);
        }
    };

    const cancelRequest = async (requestId) => {
        if (!window.confirm("Are you sure you want to cancel this request?")) return;
        try {
            await communicationService.cancelMeetingRequest(requestId);
            loadRequests();
        } catch (error) {
            console.error("Error cancelling request:", error);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: "badge-warning",
            approved: "badge-success",
            rejected: "badge-danger",
            completed: "badge-info",
            cancelled: "badge-secondary"
        };
        return badges[status] || "badge-secondary";
    };

    const formatDate = (date) => new Date(date).toLocaleDateString();
    const formatTime = (time) => {
        const [hours, minutes] = time.split(":");
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    if (loading) {
        return <div className="comm-loading">Loading meeting requests...</div>;
    }

    return (
        <div className="comm-container">
            <div className="comm-header">
                <h1>Meeting Requests</h1>
                <button className="comm-btn primary" onClick={() => setShowNewRequest(true)}>
                    + Request Meeting
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="comm-tabs">
                {["all", "pending", "approved", "rejected", "completed"].map((f) => (
                    <button
                        key={f}
                        className={`comm-tab ${filter === f ? "active" : ""}`}
                        onClick={() => setFilter(f)}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Requests List */}
            <div className="meeting-list">
                {requests.length === 0 ? (
                    <div className="comm-empty-state">
                        <p>No meeting requests found</p>
                    </div>
                ) : (
                    requests.map((req) => (
                        <div key={req.request_id} className="meeting-card">
                            <div className="meeting-header">
                                <h3>{req.other_name}</h3>
                                <span className={`meeting-badge ${getStatusBadge(req.status)}`}>
                                    {req.status}
                                </span>
                            </div>
                            <div className="meeting-details">
                                <div className="meeting-detail">
                                    <span className="label">Date:</span>
                                    <span>{formatDate(req.proposed_date)}</span>
                                </div>
                                <div className="meeting-detail">
                                    <span className="label">Time:</span>
                                    <span>{formatTime(req.proposed_time)}</span>
                                </div>
                                <div className="meeting-detail">
                                    <span className="label">Duration:</span>
                                    <span>{req.duration_minutes} minutes</span>
                                </div>
                                {req.location && (
                                    <div className="meeting-detail">
                                        <span className="label">Location:</span>
                                        <span>{req.location}</span>
                                    </div>
                                )}
                            </div>
                            <div className="meeting-purpose">
                                <span className="label">Purpose:</span>
                                <p>{req.purpose}</p>
                            </div>
                            {req.staff_notes && (
                                <div className="meeting-notes">
                                    <span className="label">Notes from Staff:</span>
                                    <p>{req.staff_notes}</p>
                                </div>
                            )}
                            {req.rejection_reason && (
                                <div className="meeting-rejection">
                                    <span className="label">Rejection Reason:</span>
                                    <p>{req.rejection_reason}</p>
                                </div>
                            )}
                            {req.status === "pending" && (
                                <div className="meeting-actions">
                                    <button
                                        className="comm-btn danger"
                                        onClick={() => cancelRequest(req.request_id)}
                                    >
                                        Cancel Request
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* New Request Modal */}
            {showNewRequest && (
                <div className="comm-modal-overlay" onClick={() => setShowNewRequest(false)}>
                    <div className="comm-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Request a Meeting</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="comm-form-group">
                                <label>Staff Type</label>
                                <select
                                    value={formData.staffType}
                                    onChange={(e) => setFormData(prev => ({ ...prev, staffType: e.target.value }))}
                                >
                                    <option value="doctor">Doctor</option>
                                    <option value="ta">Teaching Assistant</option>
                                    <option value="advisor">Advisor</option>
                                </select>
                            </div>
                            <div className="comm-form-group">
                                <label>Select Staff Member</label>
                                <select
                                    value={formData.staffId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, staffId: e.target.value }))}
                                    required
                                >
                                    <option value="">Choose...</option>
                                    {staffList
                                        .filter(s => s.staff_type === formData.staffType)
                                        .map(staff => (
                                            <option key={staff.entity_id} value={staff.entity_id}>
                                                {staff.entity_name}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div className="comm-form-row">
                                <div className="comm-form-group">
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        value={formData.proposed_date}
                                        onChange={(e) => setFormData(prev => ({ ...prev, proposed_date: e.target.value }))}
                                        min={new Date().toISOString().split("T")[0]}
                                        required
                                    />
                                </div>
                                <div className="comm-form-group">
                                    <label>Time</label>
                                    <input
                                        type="time"
                                        value={formData.proposed_time}
                                        onChange={(e) => setFormData(prev => ({ ...prev, proposed_time: e.target.value }))}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="comm-form-group">
                                <label>Duration (minutes)</label>
                                <select
                                    value={formData.duration_minutes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                                >
                                    <option value={15}>15 minutes</option>
                                    <option value={30}>30 minutes</option>
                                    <option value={45}>45 minutes</option>
                                    <option value={60}>1 hour</option>
                                </select>
                            </div>
                            <div className="comm-form-group">
                                <label>Purpose</label>
                                <textarea
                                    value={formData.purpose}
                                    onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                                    placeholder="Describe the purpose of the meeting..."
                                    rows={3}
                                    required
                                />
                            </div>
                            <div className="comm-modal-actions">
                                <button type="button" className="comm-btn secondary" onClick={() => setShowNewRequest(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="comm-btn primary">Submit Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MeetingRequests;
