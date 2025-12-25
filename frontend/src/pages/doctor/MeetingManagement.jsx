import { useState, useEffect } from "react";
import communicationService from "../../services/communicationService";
import "../student/Communication.css";

function MeetingManagement() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("pending");
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionData, setActionData] = useState({
        status: "",
        staff_notes: "",
        location: "",
        rejection_reason: ""
    });

    useEffect(() => {
        loadRequests();
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

    const handleAction = async (requestId, status) => {
        try {
            await communicationService.updateMeetingRequest(requestId, {
                status,
                staff_notes: actionData.staff_notes,
                location: actionData.location,
                rejection_reason: actionData.rejection_reason
            });
            setSelectedRequest(null);
            setActionData({ status: "", staff_notes: "", location: "", rejection_reason: "" });
            loadRequests();
        } catch (error) {
            console.error("Error updating request:", error);
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
                <h1>Meeting Management</h1>
            </div>

            {/* Filter Tabs */}
            <div className="comm-tabs">
                {["pending", "approved", "all"].map((f) => (
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
                            </div>
                            <div className="meeting-purpose">
                                <span className="label">Purpose:</span>
                                <p>{req.purpose}</p>
                            </div>

                            {req.status === "pending" && (
                                <div className="meeting-actions">
                                    <button
                                        className="comm-btn primary"
                                        onClick={() => setSelectedRequest({ ...req, action: "approve" })}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        className="comm-btn danger"
                                        onClick={() => setSelectedRequest({ ...req, action: "reject" })}
                                        style={{ marginLeft: "8px" }}
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}

                            {req.status === "approved" && (
                                <div className="meeting-actions">
                                    <button
                                        className="comm-btn secondary"
                                        onClick={() => handleAction(req.request_id, "completed")}
                                    >
                                        Mark as Completed
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Action Modal */}
            {selectedRequest && (
                <div className="comm-modal-overlay" onClick={() => setSelectedRequest(null)}>
                    <div className="comm-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>{selectedRequest.action === "approve" ? "Approve Meeting" : "Reject Meeting"}</h2>
                        <p>
                            <strong>Student:</strong> {selectedRequest.other_name}<br />
                            <strong>Date:</strong> {formatDate(selectedRequest.proposed_date)} at {formatTime(selectedRequest.proposed_time)}
                        </p>

                        {selectedRequest.action === "approve" && (
                            <>
                                <div className="comm-form-group">
                                    <label>Location</label>
                                    <input
                                        type="text"
                                        value={actionData.location}
                                        onChange={(e) => setActionData(prev => ({ ...prev, location: e.target.value }))}
                                        placeholder="e.g., Office 301, Building A"
                                    />
                                </div>
                                <div className="comm-form-group">
                                    <label>Notes for Student</label>
                                    <textarea
                                        value={actionData.staff_notes}
                                        onChange={(e) => setActionData(prev => ({ ...prev, staff_notes: e.target.value }))}
                                        placeholder="Any additional information..."
                                        rows={3}
                                    />
                                </div>
                            </>
                        )}

                        {selectedRequest.action === "reject" && (
                            <div className="comm-form-group">
                                <label>Reason for Rejection</label>
                                <textarea
                                    value={actionData.rejection_reason}
                                    onChange={(e) => setActionData(prev => ({ ...prev, rejection_reason: e.target.value }))}
                                    placeholder="Please provide a reason..."
                                    rows={3}
                                    required
                                />
                            </div>
                        )}

                        <div className="comm-modal-actions">
                            <button
                                type="button"
                                className="comm-btn secondary"
                                onClick={() => setSelectedRequest(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={`comm-btn ${selectedRequest.action === "approve" ? "primary" : "danger"}`}
                                onClick={() => handleAction(
                                    selectedRequest.request_id,
                                    selectedRequest.action === "approve" ? "approved" : "rejected"
                                )}
                            >
                                {selectedRequest.action === "approve" ? "Approve Meeting" : "Reject Request"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MeetingManagement;
