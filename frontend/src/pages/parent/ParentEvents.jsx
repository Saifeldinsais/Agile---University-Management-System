import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import eventService from "../../services/eventService";
import "./ParentPages.css";

function ParentEvents() {
    const [events, setEvents] = useState([]);
    const [childrenEvents, setChildrenEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [error, setError] = useState(null);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const [eventsRes, childrenRes] = await Promise.all([
                eventService.getEvents(),
                eventService.getChildrenEvents().catch(() => ({ data: [] }))
            ]);
            setEvents(eventsRes.data || []);
            setChildrenEvents(childrenRes.data || []);
        } catch (err) {
            setError(err.message || "Failed to load events");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (datetime) => {
        const date = new Date(datetime);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (datetime) => {
        const date = new Date(datetime);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    const getCategoryColor = (category) => {
        const colors = {
            'academic': '#667eea',
            'sports': '#10b981',
            'arts': '#f59e0b',
            'social': '#ec4899',
            'workshop': '#8b5cf6'
        };
        return colors[category?.toLowerCase()] || '#667eea';
    };

    const displayEvents = activeTab === "children" ? childrenEvents : events;

    if (loading) {
        return (
            <div className="parent-page loading">
                <div className="spinner"></div>
                <p>Loading events...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="parent-page error">
                <div className="error-card">
                    <span className="error-icon">⚠️</span>
                    <p>{error}</p>
                    <button onClick={loadEvents}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="parent-page events-page">
            <h2 className="page-title">Events</h2>

            {/* Tabs */}
            <div className="filter-bar">
                <button
                    className={`filter-btn ${activeTab === "all" ? "active" : ""}`}
                    onClick={() => setActiveTab("all")}
                >
                    📅 All Events ({events.length})
                </button>
                <button
                    className={`filter-btn ${activeTab === "children" ? "active" : ""}`}
                    onClick={() => setActiveTab("children")}
                >
                    👨‍👩‍👧 Children's Events ({childrenEvents.length})
                </button>
            </div>

            {/* Events Grid */}
            <div className="events-grid">
                {displayEvents.length > 0 ? (
                    displayEvents.map((event) => (
                        <div key={event.event_id} className="event-card">
                            <div className="event-date-badge">
                                <span className="day">{new Date(event.start_datetime).getDate()}</span>
                                <span className="month">{new Date(event.start_datetime).toLocaleString('en', { month: 'short' })}</span>
                            </div>
                            <div className="event-content">
                                <div className="event-header">
                                    <span
                                        className="category-tag"
                                        style={{ background: `${getCategoryColor(event.category_name)}20`, color: getCategoryColor(event.category_name) }}
                                    >
                                        {event.category_name || 'Event'}
                                    </span>
                                    {event.child_name && (
                                        <span className="child-tag">
                                            👤 {event.child_name}
                                        </span>
                                    )}
                                </div>
                                <h3 className="event-title">{event.title}</h3>
                                <div className="event-meta">
                                    <span className="event-time">
                                        🕐 {formatTime(event.start_datetime)}
                                    </span>
                                    <span className="event-location">
                                        📍 {event.location || 'TBA'}
                                    </span>
                                </div>
                                <p className="event-description">
                                    {event.description?.substring(0, 100)}
                                    {event.description?.length > 100 ? '...' : ''}
                                </p>
                                <div className="event-footer">
                                    <div className="event-stats">
                                        <span className="stat">
                                            <span className="stat-icon">✅</span>
                                            {event.going_count || 0} going
                                        </span>
                                        <span className="stat">
                                            <span className="stat-icon">⭐</span>
                                            {event.interested_count || 0} interested
                                        </span>
                                    </div>
                                    {event.child_rsvp_status && (
                                        <span className={`child-rsvp ${event.child_rsvp_status}`}>
                                            {event.child_rsvp_status === 'going' ? '✓ Going' : '⭐ Interested'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state large">
                        <span className="empty-icon">📅</span>
                        <h3>No Events Found</h3>
                        <p>
                            {activeTab === "children"
                                ? "Your children haven't RSVP'd to any events yet."
                                : "There are no upcoming events at this time."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ParentEvents;
