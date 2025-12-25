import { useState, useEffect } from "react";
import announcementService from "../../services/announcementService";
import styles from "./Announcements.module.css";

function DoctorAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "normal",
    target_audience: "students",
    deadline: "",
    is_pinned: false
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await announcementService.getAnnouncements();
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
      if (editingId) {
        await announcementService.updateAnnouncement(editingId, formData);
      } else {
        await announcementService.createAnnouncement(formData);
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
      target_audience: "students",
      deadline: "",
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

  const pinnedAnnouncements = announcements.filter(a => a.is_pinned);
  const regularAnnouncements = announcements.filter(a => !a.is_pinned);

  if (loading) {
    return <div className={styles.container}><p>Loading announcements...</p></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Course Announcements</h1>
        <button
          className={styles.createBtn}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ New Announcement"}
        </button>
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Announcement title"
              required
            />
          </div>

          <div className={styles.formGroup} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label>Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label>Target Audience</label>
              <select
                name="target_audience"
                value={formData.target_audience}
                onChange={handleInputChange}
              >
                <option value="students">Students Only</option>
                <option value="all">Everyone</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Announcement Content</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Type your announcement here..."
              rows="6"
              required
            />
          </div>

          <div className={styles.formGroup} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label>Deadline (Optional)</label>
              <input
                type="datetime-local"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="is_pinned"
                  checked={formData.is_pinned}
                  onChange={handleInputChange}
                  style={{ marginRight: '8px' }}
                />
                📌 Pin this announcement
              </label>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn}>
            {editingId ? 'Update Announcement' : 'Post Announcement'}
          </button>
        </form>
      )}

      {pinnedAnnouncements.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>📌 Pinned Announcements</h2>
          <div className={styles.announcementsList}>
            {pinnedAnnouncements.map((announcement) => (
              <div key={announcement.announcement_id} className={`${styles.announcementCard} ${styles.pinned}`}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3>{announcement.title}</h3>
                    <p className={styles.course}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        background: announcement.priority === 'urgent' ? '#fee2e2' :
                          announcement.priority === 'high' ? '#fef3c7' : '#f3f4f6',
                        color: announcement.priority === 'urgent' ? '#991b1b' :
                          announcement.priority === 'high' ? '#92400e' : '#374151',
                        textTransform: 'uppercase'
                      }}>
                        {announcement.priority}
                      </span>
                    </p>
                  </div>
                  <span className={styles.date}>
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p className={styles.content}>{announcement.content}</p>

                {announcement.deadline && (
                  <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '12px' }}>
                    ⏰ Deadline: {new Date(announcement.deadline).toLocaleString()}
                  </p>
                )}

                <div className={styles.actions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleTogglePin(announcement.announcement_id)}
                  >
                    Unpin
                  </button>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleEdit(announcement)}
                  >
                    Edit
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.delete}`}
                    onClick={() => handleDelete(announcement.announcement_id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Latest Announcements</h2>
        {regularAnnouncements.length === 0 ? (
          <p className={styles.empty}>No announcements yet. Create your first one!</p>
        ) : (
          <div className={styles.announcementsList}>
            {regularAnnouncements.map((announcement) => (
              <div key={announcement.announcement_id} className={styles.announcementCard}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3>{announcement.title}</h3>
                    <p className={styles.course}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        background: announcement.priority === 'urgent' ? '#fee2e2' :
                          announcement.priority === 'high' ? '#fef3c7' : '#f3f4f6',
                        color: announcement.priority === 'urgent' ? '#991b1b' :
                          announcement.priority === 'high' ? '#92400e' : '#374151',
                        textTransform: 'uppercase'
                      }}>
                        {announcement.priority}
                      </span>
                      <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                        {announcement.target_audience === 'students' ? '👨‍🎓 Students' : '🌍 Everyone'}
                      </span>
                    </p>
                  </div>
                  <span className={styles.date}>
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p className={styles.content}>{announcement.content}</p>

                {announcement.deadline && (
                  <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '12px' }}>
                    ⏰ Deadline: {new Date(announcement.deadline).toLocaleString()}
                  </p>
                )}

                <div className={styles.actions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleTogglePin(announcement.announcement_id)}
                  >
                    Pin
                  </button>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleEdit(announcement)}
                  >
                    Edit
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.delete}`}
                    onClick={() => handleDelete(announcement.announcement_id)}
                  >
                    Delete
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

export default DoctorAnnouncements;
