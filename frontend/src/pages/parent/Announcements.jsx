import { useState, useEffect } from "react";
import parentService from "../../services/parentService";
import "./ParentPages.css";

function Announcements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [filter, setFilter] = useState("all"); // all, unread, priority

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        try {
            setLoading(true);
            const response = await parentService.getAnnouncements();
            setAnnouncements(response.data);
        } catch (err) {
            console.error("Failed to load announcements:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (announcementId) => {
        try {
            await parentService.markAnnouncementRead(announcementId);
            setAnnouncements((prev) =>
                prev.map((a) =>
                    a.announcement_id === announcementId ? { ...a, is_read: true } : a
                )
            );
        } catch (err) {
            console.error("Failed to mark as read:", err);
        }
    };

    const filteredAnnouncements = announcements.filter((a) => {
        if (filter === "unread") return !a.is_read;
        if (filter === "priority") return a.priority === "high" || a.priority === "urgent";
        return true;
    });

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case "urgent": return "🔴";
            case "high": return "🟠";
            case "normal": return "🔵";
            case "low": return "🟢";
            default: return "⚪";
        }
    };

    if (loading) {
        return (
            <div className="parent-page loading">
                <div className="spinner"></div>
                <p>Loading announcements...</p>
            </div>
        );
    }

    return (
        <div className="parent-page announcements-page">
            <h2 className="page-title">Announcements</h2>

            {/* Filter Bar */}
            <div className="filter-bar">
                <button
                    className={`filter-btn ${filter === "all" ? "active" : ""}`}
                    onClick={() => setFilter("all")}
                >
                    All ({announcements.length})
                </button>
                <button
                    className={`filter-btn ${filter === "unread" ? "active" : ""}`}
                    onClick={() => setFilter("unread")}
                >
                    Unread ({announcements.filter((a) => !a.is_read).length})
                </button>
                <button
                    className={`filter-btn ${filter === "priority" ? "active" : ""}`}
                    onClick={() => setFilter("priority")}
                >
                    Important
                </button>
            </div>

            <div className="announcements-content">
                {/* Announcements List */}
                <div className="announcements-list-panel">
                    {filteredAnnouncements.length > 0 ? (
                        filteredAnnouncements.map((announcement) => (
                            <div
                                key={announcement.announcement_id}
                                className={`announcement-card ${!announcement.is_read ? "unread" : ""} ${selectedAnnouncement?.announcement_id === announcement.announcement_id
                                        ? "selected"
                                        : ""
                                    }`}
                                onClick={() => {
                                    setSelectedAnnouncement(announcement);
                                    if (!announcement.is_read) {
                                        handleMarkAsRead(announcement.announcement_id);
                                    }
                                }}
                            >
                                <div className="announcement-left">
                                    <span className="priority-icon">
                                        {getPriorityIcon(announcement.priority)}
                                    </span>
                                    {!announcement.is_read && <span className="unread-dot" />}
                                </div>
                                <div className="announcement-info">
                                    <h4>{announcement.title}</h4>
                                    <div className="announcement-meta">
                                        <span className={`priority-badge ${announcement.priority}`}>
                                            {announcement.priority}
                                        </span>
                                        <span className="date">
                                            {new Date(announcement.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <span className="empty-icon">📭</span>
                            <p>No announcements found</p>
                        </div>
                    )}
                </div>

                {/* Announcement Detail */}
                <div className="announcement-detail">
                    {selectedAnnouncement ? (
                        <>
                            <div className="detail-header">
                                <div className="detail-priority">
                                    {getPriorityIcon(selectedAnnouncement.priority)}
                                    <span className={`priority-badge ${selectedAnnouncement.priority}`}>
                                        {selectedAnnouncement.priority}
                                    </span>
                                </div>
                                <span className="detail-date">
                                    {new Date(selectedAnnouncement.created_at).toLocaleString()}
                                </span>
                            </div>
                            <h2 className="detail-title">{selectedAnnouncement.title}</h2>
                            <div className="detail-content">
                                {selectedAnnouncement.content}
                            </div>
                            {selectedAnnouncement.expires_at && (
                                <div className="detail-expires">
                                    Expires: {new Date(selectedAnnouncement.expires_at).toLocaleDateString()}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="no-selection">
                            <span className="icon">📢</span>
                            <p>Select an announcement to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Announcements;
