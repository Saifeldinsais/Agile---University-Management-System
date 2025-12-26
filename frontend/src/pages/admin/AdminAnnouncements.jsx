import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import announcementService from "../../services/announcementService";
import AdminNavbar from "../../components/AdminNavbar";
import "./dashboard.css";

function AdminAnnouncements() {
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [filter, setFilter] = useState('all');
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        priority: "normal",
        target_audience: "all",
        deadline: "",
        expires_at: "",
        is_pinned: false
    });

    useEffect(() => {
        loadAnnouncements();
    }, [filter]);

    const loadAnnouncements = async () => {
        try {
            setLoading(true);
            const filters = filter !== 'all' ? { status: filter } : {};
            const response = await announcementService.getAnnouncements(filters);
            setAnnouncements(response.data || []);
        } catch (error) {
            console.error("Error loading announcements:", error);
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
            const dataToSend = {
                ...formData,
                deadline: formData.deadline || null,
                expires_at: formData.expires_at || null
            };

            if (editingId) {
                await announcementService.updateAnnouncement(editingId, dataToSend);
            } else {
                await announcementService.createAnnouncement(dataToSend);
            }
            resetForm();
            loadAnnouncements();
        } catch (error) {
            console.error("Error saving announcement:", error);
            alert("Error saving announcement: " + error.message);
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            content: "",
            priority: "normal",
            target_audience: "all",
            deadline: "",
            expires_at: "",
            is_pinned: false
        });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (announcement) => {
        setFormData({
            title: announcement.title,
            content: announcement.content,
            priority: announcement.priority,
            target_audience: announcement.target_audience,
            deadline: announcement.deadline ? announcement.deadline.slice(0, 16) : "",
            expires_at: announcement.expires_at ? announcement.expires_at.slice(0, 16) : "",
            is_pinned: announcement.is_pinned
        });
        setEditingId(announcement.announcement_id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this announcement?")) return;
        try {
            await announcementService.deleteAnnouncement(id);
            loadAnnouncements();
        } catch (error) {
            console.error("Error deleting announcement:", error);
        }
    };

    const handleTogglePin = async (id) => {
        try {
            await announcementService.togglePin(id);
            loadAnnouncements();
        } catch (error) {
            console.error("Error toggling pin:", error);
        }
    };

    const handleArchive = async (id) => {
        try {
            await announcementService.archiveAnnouncement(id);
            loadAnnouncements();
        } catch (error) {
            console.error("Error archiving announcement:", error);
        }
    };

    const getPriorityColor = (priority) => {
        const colors = { low: '#10b981', normal: '#3b82f6', high: '#f59e0b', urgent: '#ef4444' };
        return colors[priority] || colors.normal;
    };

    const getAudienceLabel = (audience) => {
        const labels = { all: '🌍 Everyone', students: '👨‍🎓 Students', parents: '👪 Parents', staff: '👨‍🏫 Staff', custom: '🎯 Custom' };
        return labels[audience] || audience;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="admin-layout">
            <AdminNavbar />

            <main className="admin-main">
                <header className="admin-header">
                    <div>
                        <h1>Announcements</h1>
                        <p className="subtitle">Create and manage university announcements</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        style={{ background: showForm ? '#ef4444' : '#3b82f6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: '500' }}
                    >
                        {showForm ? '✕ Cancel' : '+ New Announcement'}
                    </button>
                </header>

                {showForm && (
                    <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ margin: '0 0 20px', fontSize: '1.25rem' }}>{editingId ? 'Edit Announcement' : 'Create New Announcement'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>Title *</label>
                                    <input type="text" name="title" value={formData.title} onChange={handleInputChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }} placeholder="Announcement title" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>Priority</label>
                                        <select name="priority" value={formData.priority} onChange={handleInputChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }}>
                                            <option value="low">Low</option>
                                            <option value="normal">Normal</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>Target Audience</label>
                                        <select name="target_audience" value={formData.target_audience} onChange={handleInputChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }}>
                                            <option value="all">Everyone</option>
                                            <option value="students">Students Only</option>
                                            <option value="parents">Parents Only</option>
                                            <option value="staff">Staff Only</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>Content *</label>
                                <textarea name="content" value={formData.content} onChange={handleInputChange} required rows={4} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', resize: 'vertical', boxSizing: 'border-box' }} placeholder="Announcement content..." />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>Deadline (Optional)</label>
                                    <input type="datetime-local" name="deadline" value={formData.deadline} onChange={handleInputChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>Expires At (Optional)</label>
                                    <input type="datetime-local" name="expires_at" value={formData.expires_at} onChange={handleInputChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', paddingTop: '28px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                        <input type="checkbox" name="is_pinned" checked={formData.is_pinned} onChange={handleInputChange} style={{ marginRight: '8px', width: '18px', height: '18px' }} />
                                        <span style={{ fontWeight: '500', color: '#374151' }}>📌 Pin this announcement</span>
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="submit" style={{ background: '#10b981', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>{editingId ? 'Update Announcement' : 'Publish Announcement'}</button>
                                <button type="button" onClick={resetForm} style={{ background: '#f3f4f6', color: '#374151', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    {['all', 'published', 'archived'].map(status => (
                        <button key={status} onClick={() => setFilter(status)} style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: filter === status ? '#3b82f6' : '#f3f4f6', color: filter === status ? 'white' : '#374151', fontWeight: '500', textTransform: 'capitalize' }}>
                            {status === 'all' ? 'All' : status}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading announcements...</div>
                ) : announcements.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px', color: '#6b7280' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📢</div>
                        <p>No announcements yet. Create your first one!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {announcements.map(announcement => (
                            <div key={announcement.announcement_id} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: `4px solid ${getPriorityColor(announcement.priority)}`, opacity: announcement.status === 'archived' ? 0.6 : 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                            {announcement.is_pinned && <span title="Pinned">📌</span>}
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{announcement.title}</h3>
                                            <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', background: getPriorityColor(announcement.priority) + '20', color: getPriorityColor(announcement.priority), textTransform: 'uppercase' }}>{announcement.priority}</span>
                                            <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', background: '#f3f4f6', color: '#6b7280' }}>{getAudienceLabel(announcement.target_audience)}</span>
                                        </div>
                                        <p style={{ margin: '0 0 12px', color: '#4b5563', lineHeight: '1.6' }}>{announcement.content.length > 200 ? announcement.content.substring(0, 200) + '...' : announcement.content}</p>
                                        <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', color: '#6b7280', flexWrap: 'wrap' }}>
                                            <span>📅 {formatDate(announcement.created_at)}</span>
                                            {announcement.deadline && <span style={{ color: '#ef4444' }}>⏰ Deadline: {formatDate(announcement.deadline)}</span>}
                                            <span>👁️ {announcement.read_count || 0} reads</span>
                                            <span>By: {announcement.creator_name || 'Admin'}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                        <button onClick={() => handleTogglePin(announcement.announcement_id)} title={announcement.is_pinned ? 'Unpin' : 'Pin'} style={{ padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: announcement.is_pinned ? '#fef3c7' : '#f3f4f6', fontSize: '1rem' }}>📌</button>
                                        <button onClick={() => handleEdit(announcement)} title="Edit" style={{ padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: '#f3f4f6', fontSize: '1rem' }}>✏️</button>
                                        {announcement.status !== 'archived' && <button onClick={() => handleArchive(announcement.announcement_id)} title="Archive" style={{ padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: '#f3f4f6', fontSize: '1rem' }}>📥</button>}
                                        <button onClick={() => handleDelete(announcement.announcement_id)} title="Delete" style={{ padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: '#fee2e2', fontSize: '1rem' }}>🗑️</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default AdminAnnouncements;
