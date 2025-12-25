import { useState, useEffect } from "react";
import eventService from "../../services/eventService";
import styles from "./StudentPages.module.css";

function Events() {
    const [events, setEvents] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [viewMode, setViewMode] = useState('calendar');
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        document.title = 'Events - University Calendar';
        loadCategories();
    }, []);

    useEffect(() => {
        loadEvents();
    }, [currentDate]);

    const loadCategories = async () => {
        try {
            const response = await eventService.getCategories();
            setCategories(response.data || []);
        } catch (error) {
            console.error("Error loading categories:", error);
        }
    };

    const loadEvents = async () => {
        try {
            setLoading(true);
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const response = await eventService.getCalendarEvents(year, month);
            setEvents(response.data || []);
        } catch (error) {
            console.error("Error loading events:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRsvp = async (eventId, status) => {
        try {
            await eventService.rsvpEvent(eventId, status);
            loadEvents();
            if (selectedEvent && selectedEvent.event_id === eventId) {
                const response = await eventService.getEventById(eventId);
                setSelectedEvent(response.data);
            }
        } catch (error) {
            console.error("Error updating RSVP:", error);
        }
    };

    // Calendar helpers
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        const days = [];
        for (let i = 0; i < startDayOfWeek; i++) {
            const prevDate = new Date(year, month, -startDayOfWeek + i + 1);
            days.push({ date: prevDate, isCurrentMonth: false });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ date: new Date(year, month, i), isCurrentMonth: true });
        }
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
        }
        return days;
    };

    const getEventsForDay = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        return events.filter(e => {
            const eventDate = new Date(e.start_datetime).toISOString().split('T')[0];
            return eventDate === dateStr && (selectedCategory === 'all' || e.category_id == selectedCategory);
        });
    };

    const formatTime = (datetime) => new Date(datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const formatDate = (datetime) => new Date(datetime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

    const days = getDaysInMonth(currentDate);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const filteredEvents = selectedCategory === 'all'
        ? events
        : events.filter(e => e.category_id == selectedCategory);

    const getRsvpButtonStyle = (status, currentRsvp) => ({
        padding: '8px 16px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '500',
        background: currentRsvp === status ? (status === 'going' ? '#10b981' : status === 'interested' ? '#f59e0b' : '#6b7280') : '#f3f4f6',
        color: currentRsvp === status ? 'white' : '#374151'
    });

    if (loading) {
        return (
            <div className={styles.pageContainer}>
                <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>Loading events...</div>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
                <h1>📅 University Events</h1>
                <p>Discover and RSVP to upcoming events</p>
            </div>

            {/* Filters & View Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setSelectedCategory('all')}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            background: selectedCategory === 'all' ? '#3b82f6' : '#f3f4f6',
                            color: selectedCategory === 'all' ? 'white' : '#374151',
                            fontWeight: '500'
                        }}
                    >
                        All Events
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.category_id}
                            onClick={() => setSelectedCategory(cat.category_id)}
                            style={{
                                padding: '8px 16px',
                                border: 'none',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                background: selectedCategory === cat.category_id ? cat.color : '#f3f4f6',
                                color: selectedCategory === cat.category_id ? 'white' : '#374151',
                                fontWeight: '500'
                            }}
                        >
                            {cat.icon} {cat.name}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', borderRadius: '8px', padding: '4px' }}>
                    <button
                        onClick={() => setViewMode('calendar')}
                        style={{
                            padding: '6px 12px',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: viewMode === 'calendar' ? 'white' : 'transparent'
                        }}
                    >
                        📅
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        style={{
                            padding: '6px 12px',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: viewMode === 'list' ? 'white' : 'transparent'
                        }}
                    >
                        📋
                    </button>
                </div>
            </div>

            <div className={styles.pageContent}>
                {/* Calendar View */}
                {viewMode === 'calendar' && (
                    <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <button onClick={prevMonth} style={{ background: '#f3f4f6', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' }}>←</button>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </h2>
                            <button onClick={nextMonth} style={{ background: '#f3f4f6', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' }}>→</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
                            {weekDays.map(day => (
                                <div key={day} style={{ textAlign: 'center', fontWeight: '600', color: '#6b7280', padding: '8px', fontSize: '0.85rem' }}>{day}</div>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                            {days.map((day, idx) => {
                                const dayEvents = getEventsForDay(day.date);
                                const isToday = day.date.toDateString() === new Date().toDateString();

                                return (
                                    <div
                                        key={idx}
                                        style={{
                                            minHeight: '80px',
                                            padding: '6px',
                                            background: day.isCurrentMonth ? (isToday ? '#eff6ff' : 'white') : '#f9fafb',
                                            border: isToday ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                                            borderRadius: '6px'
                                        }}
                                    >
                                        <div style={{ fontWeight: '500', color: day.isCurrentMonth ? '#1e293b' : '#9ca3af', fontSize: '0.85rem', marginBottom: '2px' }}>
                                            {day.date.getDate()}
                                        </div>
                                        {dayEvents.slice(0, 2).map(event => (
                                            <div
                                                key={event.event_id}
                                                onClick={() => setSelectedEvent(event)}
                                                style={{
                                                    fontSize: '0.7rem',
                                                    padding: '2px 4px',
                                                    borderRadius: '3px',
                                                    background: event.category_color || '#3b82f6',
                                                    color: 'white',
                                                    marginBottom: '1px',
                                                    cursor: 'pointer',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {event.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 2 && (
                                            <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>+{dayEvents.length - 2}</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filteredEvents.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', color: '#6b7280' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📭</div>
                                <p>No events this month</p>
                            </div>
                        ) : (
                            filteredEvents.map(event => (
                                <div
                                    key={event.event_id}
                                    onClick={() => setSelectedEvent(event)}
                                    style={{
                                        background: 'white',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                        borderLeft: `4px solid ${event.category_color || '#3b82f6'}`,
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                <span style={{ fontSize: '1.25rem' }}>{event.category_icon || '📅'}</span>
                                                <h3 style={{ margin: 0, fontSize: '1rem' }}>{event.title}</h3>
                                                {event.user_rsvp === 'going' && (
                                                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', background: '#dcfce7', color: '#166534' }}>✓ Going</span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: '#6b7280' }}>
                                                <span>📅 {formatDate(event.start_datetime)}</span>
                                                <span>🕐 {formatTime(event.start_datetime)}</span>
                                                {event.location && <span>📍 {event.location}</span>}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', color: '#6b7280' }}>
                                            <span>✅ {event.going_count || 0}</span>
                                            <span>⭐ {event.interested_count || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Event Detail Modal */}
            {selectedEvent && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                    onClick={() => setSelectedEvent(null)}
                >
                    <div
                        style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '1.5rem' }}>{selectedEvent.category_icon || '📅'}</span>
                                    {selectedEvent.category_name && (
                                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', background: selectedEvent.category_color + '20', color: selectedEvent.category_color }}>{selectedEvent.category_name}</span>
                                    )}
                                </div>
                                <h2 style={{ margin: 0 }}>{selectedEvent.title}</h2>
                            </div>
                            <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>×</button>
                        </div>

                        <div style={{ marginBottom: '20px', lineHeight: '1.8' }}>
                            <p><strong>📅 Date:</strong> {formatDate(selectedEvent.start_datetime)}</p>
                            <p><strong>🕐 Time:</strong> {formatTime(selectedEvent.start_datetime)} - {formatTime(selectedEvent.end_datetime)}</p>
                            {selectedEvent.location && <p><strong>📍 Location:</strong> {selectedEvent.location}</p>}
                            {selectedEvent.description && (
                                <>
                                    <p style={{ marginTop: '12px', fontWeight: '600' }}>About this event:</p>
                                    <p style={{ color: '#4b5563' }}>{selectedEvent.description}</p>
                                </>
                            )}
                            <p style={{ marginTop: '12px' }}>
                                <strong>👥 RSVPs:</strong> {selectedEvent.going_count || 0} going · {selectedEvent.interested_count || 0} interested
                            </p>
                        </div>

                        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                            <p style={{ fontWeight: '600', marginBottom: '12px' }}>Will you attend?</p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => handleRsvp(selectedEvent.event_id, 'going')}
                                    style={getRsvpButtonStyle('going', selectedEvent.user_rsvp)}
                                >
                                    ✓ Going
                                </button>
                                <button
                                    onClick={() => handleRsvp(selectedEvent.event_id, 'interested')}
                                    style={getRsvpButtonStyle('interested', selectedEvent.user_rsvp)}
                                >
                                    ⭐ Interested
                                </button>
                                <button
                                    onClick={() => handleRsvp(selectedEvent.event_id, 'not_going')}
                                    style={getRsvpButtonStyle('not_going', selectedEvent.user_rsvp)}
                                >
                                    ✗ Not Going
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Events;
