import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import parentService from "../../services/parentService";
import "./ParentPages.css";

function ParentDashboard() {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const response = await parentService.getDashboard();
            setDashboard(response.data);
        } catch (err) {
            setError(err.message || "Failed to load dashboard");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="parent-page loading">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="parent-page error">
                <div className="error-card">
                    <span className="error-icon">⚠️</span>
                    <p>{error}</p>
                    <button onClick={loadDashboard}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="parent-page dashboard">
            <h2 className="page-title">Dashboard Overview</h2>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">👨‍🎓</div>
                    <div className="stat-info">
                        <span className="stat-value">{dashboard?.linkedStudents || 0}</span>
                        <span className="stat-label">Linked Students</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">💬</div>
                    <div className="stat-info">
                        <span className="stat-value">{dashboard?.unreadMessages || 0}</span>
                        <span className="stat-label">Unread Messages</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📢</div>
                    <div className="stat-info">
                        <span className="stat-value">{dashboard?.unreadAnnouncements || 0}</span>
                        <span className="stat-label">New Announcements</span>
                    </div>
                </div>
            </div>

            {/* Students Section */}
            <section className="dashboard-section">
                <div className="section-header">
                    <h3>My Students</h3>
                    <Link to="/parent/students" className="view-all-link">
                        View All →
                    </Link>
                </div>
                <div className="students-grid">
                    {dashboard?.students?.length > 0 ? (
                        dashboard.students.map((student) => (
                            <div key={student.id} className="student-card">
                                <div className="student-avatar">
                                    {student.name?.charAt(0) || "S"}
                                </div>
                                <div className="student-info">
                                    <h4>{student.name}</h4>
                                    <span className="relationship">{student.relationship}</span>
                                </div>
                                <Link
                                    to={`/parent/students/${student.id}/progress`}
                                    className="view-progress-btn"
                                >
                                    View Progress
                                </Link>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <span className="empty-icon">👤</span>
                            <p>No students linked yet</p>
                            <span className="empty-hint">
                                Contact administration to link your children
                            </span>
                        </div>
                    )}
                </div>
            </section>

            {/* Recent Announcements */}
            <section className="dashboard-section">
                <div className="section-header">
                    <h3>Recent Announcements</h3>
                    <Link to="/parent/announcements" className="view-all-link">
                        View All →
                    </Link>
                </div>
                <div className="announcements-list">
                    {dashboard?.recentAnnouncements?.length > 0 ? (
                        dashboard.recentAnnouncements.map((announcement, index) => (
                            <div key={index} className={`announcement-item priority-${announcement.priority}`}>
                                <div className="announcement-header">
                                    <span className={`priority-badge ${announcement.priority}`}>
                                        {announcement.priority}
                                    </span>
                                    <span className="announcement-date">
                                        {new Date(announcement.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h4>{announcement.title}</h4>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <span className="empty-icon">📭</span>
                            <p>No announcements yet</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Quick Actions */}
            <section className="dashboard-section">
                <h3>Quick Actions</h3>
                <div className="quick-actions">
                    <Link to="/parent/messages" className="action-card">
                        <span className="action-icon">✉️</span>
                        <span className="action-label">Send Message</span>
                    </Link>
                    <Link to="/parent/students" className="action-card">
                        <span className="action-icon">📊</span>
                        <span className="action-label">View Grades</span>
                    </Link>
                    <Link to="/parent/announcements" className="action-card">
                        <span className="action-icon">📋</span>
                        <span className="action-label">Announcements</span>
                    </Link>
                    <Link to="/parent/profile" className="action-card">
                        <span className="action-icon">⚙️</span>
                        <span className="action-label">Settings</span>
                    </Link>
                </div>
            </section>
        </div>
    );
}

export default ParentDashboard;
