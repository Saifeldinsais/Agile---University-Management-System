import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import eventService from "../../services/eventService";
import AdminNavbar from "../../components/AdminNavbar";
import "./dashboard.css";

function AdminEvents() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [viewMode, setViewMode] = useState('calendar');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category_id: "",
        location: "",
        start_datetime: "",
        end_datetime: "",
        max_capacity: "",
        target_audience: "all",
        is_public: true
    });

    useEffect(() => {
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

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSend = { ...formData, category_id: formData.category_id || null, max_capacity: formData.max_capacity || null };
            if (editingId) {
                await eventService.updateEvent(editingId, dataToSend);
            } else {
                await eventService.createEvent(dataToSend);
            }
            resetForm();
            loadEvents();
        } catch (error) {
            console.error("Error saving event:", error);
            alert("Error saving event: " + error.message);
        }
    };

    const resetForm = () => {
        setFormData({ title: "", description: "", category_id: "", location: "", start_datetime: "", end_datetime: "", max_capacity: "", target_audience: "all", is_public: true });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (event) => {
        setFormData({
            title: event.title,
            description: event.description || "",
            category_id: event.category_id || "",
            location: event.location || "",
            start_datetime: event.start_datetime ? event.start_datetime.slice(0, 16) : "",
            end_datetime: event.end_datetime ? event.end_datetime.slice(0, 16) : "",
            max_capacity: event.max_capacity || "",
            target_audience: event.target_audience,
            is_public: event.is_public
        });
        setEditingId(event.event_id);
        setShowForm(true);
        setSelectedEvent(null);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this event?")) return;
        try {
            await eventService.deleteEvent(id);
            loadEvents();
            setSelectedEvent(null);
        } catch (error) {
            console.error("Error deleting event:", error);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this event?")) return;
        try {
            await eventService.cancelEvent(id);
            loadEvents();
            setSelectedEvent(null);
        } catch (error) {
            console.error("Error cancelling event:", error);
        }
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();
        const days = [];
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push({ date: new Date(year, month, -startDayOfWeek + i + 1), isCurrentMonth: false });
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
        return events.filter(e => new Date(e.start_datetime).toISOString().split('T')[0] === dateStr);
    };

    const formatTime = (datetime) => new Date(datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    const days = getDaysInMonth(currentDate);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="admin-layout">
            <AdminNavbar />

            <main className="admin-main">
                <header className="admin-header">
                    <div>
                        <h1>Events</h1>
                        <p className="subtitle">Create and manage university events</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', borderRadius: '8px', padding: '4px' }}>
                            <button onClick={() => setViewMode('calendar')} style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: viewMode === 'calendar' ? 'white' : 'transparent', boxShadow: viewMode === 'calendar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>📅 Calendar</button>
                            <button onClick={() => setViewMode('list')} style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: viewMode === 'list' ? 'white' : 'transparent', boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>📋 List</button>
                        </div>
                        <button onClick={() => setShowForm(!showForm)} style={{ background: showForm ? '#ef4444' : '#3b82f6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>{showForm ? '✕ Cancel' : '+ New Event'}</button>
                    </div>
                </header>

                {showForm && (
                    <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ margin: '0 0 20px', fontSize: '1.25rem' }}>{editingId ? 'Edit Event' : 'Create New Event'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>Title *</label>
                                    <input type="text" name="title" value={formData.title} onChange={handleInputChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }} placeholder="Event title" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>Category</label>
                                        <select name="category_id" value={formData.category_id} onChange={handleInputChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }}>
                                            <option value="">Select category</option>
                                            {categories.map(cat => <option key={cat.category_id} value={cat.category_id}>{cat.icon} {cat.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>Target Audience</label>
                                        <select name="target_audience" value={formData.target_audience} onChange={handleInputChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }}>
                                            <option value="all">Everyone</option>
                                            <option value="students">Students Only</option>
                                            <option value="staff">Staff Only</option>
                                            <option value="parents">Parents Only</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>Description</label>
                                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box', resize: 'vertical' }} placeholder="Event description..." />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>Start *</label>
                                    <input type="datetime-local" name="start_datetime" value={formData.start_datetime} onChange={handleInputChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>End *</label>
                                    <input type="datetime-local" name="end_datetime" value={formData.end_datetime} onChange={handleInputChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>Location</label>
                                    <input type="text" name="location" value={formData.location} onChange={handleInputChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }} placeholder="Location" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>Capacity</label>
                                    <input type="number" name="max_capacity" value={formData.max_capacity} onChange={handleInputChange} min="1" style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }} placeholder="Unlimited" />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="submit" style={{ background: '#10b981', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>{editingId ? 'Update Event' : 'Create Event'}</button>
                                <button type="button" onClick={resetForm} style={{ background: '#f3f4f6', color: '#374151', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                {viewMode === 'calendar' && (
                    <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <button onClick={prevMonth} style={{ background: '#f3f4f6', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem' }}>←</button>
                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                            <button onClick={nextMonth} style={{ background: '#f3f4f6', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem' }}>→</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                            {weekDays.map(day => <div key={day} style={{ textAlign: 'center', fontWeight: '600', color: '#6b7280', padding: '8px' }}>{day}</div>)}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                            {days.map((day, idx) => {
                                const dayEvents = getEventsForDay(day.date);
                                const isToday = day.date.toDateString() === new Date().toDateString();
                                return (
                                    <div key={idx} style={{ minHeight: '100px', padding: '8px', background: day.isCurrentMonth ? (isToday ? '#eff6ff' : 'white') : '#f9fafb', border: isToday ? '2px solid #3b82f6' : '1px solid #e5e7eb', borderRadius: '8px' }}>
                                        <div style={{ fontWeight: '500', color: day.isCurrentMonth ? '#1e293b' : '#9ca3af', marginBottom: '4px' }}>{day.date.getDate()}</div>
                                        {dayEvents.slice(0, 3).map(event => (
                                            <div key={event.event_id} onClick={() => setSelectedEvent(event)} style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: event.category_color || '#3b82f6', color: 'white', marginBottom: '2px', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {event.category_icon} {formatTime(event.start_datetime)} {event.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 3 && <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>+{dayEvents.length - 3} more</div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {viewMode === 'list' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading events...</div>
                        ) : events.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px', color: '#6b7280' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📅</div>
                                <p>No events this month</p>
                            </div>
                        ) : (
                            events.map(event => (
                                <div key={event.event_id} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: `4px solid ${event.category_color || '#3b82f6'}`, opacity: event.status === 'cancelled' ? 0.6 : 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '1.5rem' }}>{event.category_icon || '📅'}</span>
                                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{event.title}</h3>
                                                {event.category_name && <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', background: event.category_color + '20', color: event.category_color }}>{event.category_name}</span>}
                                                {event.status === 'cancelled' && <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', background: '#fee2e2', color: '#991b1b' }}>Cancelled</span>}
                                            </div>
                                            {event.description && <p style={{ margin: '0 0 12px', color: '#4b5563' }}>{event.description.substring(0, 150)}...</p>}
                                            <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', color: '#6b7280', flexWrap: 'wrap' }}>
                                                <span>📅 {new Date(event.start_datetime).toLocaleDateString()} {formatTime(event.start_datetime)}</span>
                                                {event.location && <span>📍 {event.location}</span>}
                                                <span>✅ {event.going_count || 0} going</span>
                                                <span>⭐ {event.interested_count || 0} interested</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                            <button onClick={() => handleEdit(event)} title="Edit" style={{ padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: '#f3f4f6' }}>✏️</button>
                                            {event.status !== 'cancelled' && <button onClick={() => handleCancel(event.event_id)} title="Cancel" style={{ padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: '#fef3c7' }}>🚫</button>}
                                            <button onClick={() => handleDelete(event.event_id)} title="Delete" style={{ padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: '#fee2e2' }}>🗑️</button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {selectedEvent && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedEvent(null)}>
                        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h2 style={{ margin: 0 }}>{selectedEvent.category_icon} {selectedEvent.title}</h2>
                                <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <p><strong>📅 When:</strong> {new Date(selectedEvent.start_datetime).toLocaleString()} - {formatTime(selectedEvent.end_datetime)}</p>
                                {selectedEvent.location && <p><strong>📍 Where:</strong> {selectedEvent.location}</p>}
                                {selectedEvent.description && <p><strong>📝 Description:</strong> {selectedEvent.description}</p>}
                                <p><strong>👥 RSVPs:</strong> {selectedEvent.going_count || 0} going, {selectedEvent.interested_count || 0} interested</p>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => handleEdit(selectedEvent)} style={{ flex: 1, padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Edit</button>
                                <button onClick={() => handleDelete(selectedEvent.event_id)} style={{ flex: 1, padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Delete</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default AdminEvents;
