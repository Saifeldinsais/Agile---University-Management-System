import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../../services/apiClient";
import "./AdminPages.css";

function AdminParentRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get("/admin/parent-requests");
            setRequests(response.data.data || []);
            setError("");
        } catch (err) {
            setError("Failed to load parent requests");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (linkId) => {
        if (!window.confirm("Are you sure you want to approve this link request?")) return;

        setActionLoading(linkId);
        try {
            await apiClient.patch(`/admin/parent-requests/${linkId}/approve`);
            setRequests(requests.filter(r => r.link_id !== linkId));
        } catch (err) {
            alert("Failed to approve request: " + (err.response?.data?.message || err.message));
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (linkId) => {
        if (!window.confirm("Are you sure you want to reject this link request?")) return;

        setActionLoading(linkId);
        try {
            await apiClient.patch(`/admin/parent-requests/${linkId}/reject`);
            setRequests(requests.filter(r => r.link_id !== linkId));
        } catch (err) {
            alert("Failed to reject request: " + (err.response?.data?.message || err.message));
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="admin-page">
            <div className="admin-header">
                <Link to="/admin/dashboard" className="back-link">
                    ← Back to Dashboard
                </Link>
                <h1>Parent Link Requests</h1>
                <p>Review and manage parent-student link requests</p>
            </div>

            <div className="admin-content">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading requests...</p>
                    </div>
                ) : error ? (
                    <div className="error-state">
                        <p>⚠️ {error}</p>
                        <button onClick={fetchRequests}>Try Again</button>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <h2>No Pending Requests</h2>
                        <p>There are no parent-student link requests waiting for approval.</p>
                    </div>
                ) : (
                    <div className="requests-grid">
                        {requests.map(request => (
                            <div key={request.link_id} className="request-card">
                                <div className="request-header">
                                    <span className="badge pending">Pending</span>
                                    <span className="date">{formatDate(request.created_at)}</span>
                                </div>

                                <div className="request-body">
                                    <div className="person-info">
                                        <div className="avatar parent">👤</div>
                                        <div className="details">
                                            <span className="label">Parent</span>
                                            <span className="name">{request.parent_name}</span>
                                            <span className="email">{request.parent_email}</span>
                                        </div>
                                    </div>

                                    <div className="link-arrow">
                                        <span className="relationship">{request.relationship}</span>
                                        <div className="arrow">→</div>
                                    </div>

                                    <div className="person-info">
                                        <div className="avatar student">🎓</div>
                                        <div className="details">
                                            <span className="label">Student</span>
                                            <span className="name">{request.student_name}</span>
                                            <span className="email">{request.student_email}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="request-actions">
                                    <button
                                        className="btn approve"
                                        onClick={() => handleApprove(request.link_id)}
                                        disabled={actionLoading === request.link_id}
                                    >
                                        {actionLoading === request.link_id ? "..." : "✓ Approve"}
                                    </button>
                                    <button
                                        className="btn reject"
                                        onClick={() => handleReject(request.link_id)}
                                        disabled={actionLoading === request.link_id}
                                    >
                                        {actionLoading === request.link_id ? "..." : "✗ Reject"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminParentRequests;
