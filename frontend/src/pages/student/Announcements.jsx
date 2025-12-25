import { useState, useEffect } from "react";
import announcementService from "../../services/announcementService";
import styles from "./StudentPages.module.css";

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    document.title = 'Announcements - News & Updates';
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const response = await announcementService.getAnnouncements();
      setAnnouncements(response.data || []);
    } catch (error) {
      console.error("Error loading announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await announcementService.markAsRead(id);
      setAnnouncements(prev => prev.map(a =>
        a.announcement_id === id ? { ...a, is_read: true } : a
      ));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
    // Mark as read when expanding
    const announcement = announcements.find(a => a.announcement_id === id);
    if (announcement && !announcement.is_read) {
      handleMarkAsRead(id);
    }
  };

  const getPriorityStyle = (priority) => {
    const styles = {
      low: { bg: '#f0fdf4', border: '#86efac', color: '#166534' },
      normal: { bg: '#eff6ff', border: '#93c5fd', color: '#1e40af' },
      high: { bg: '#fef3c7', border: '#fcd34d', color: '#92400e' },
      urgent: { bg: '#fee2e2', border: '#fca5a5', color: '#991b1b' }
    };
    return styles[priority] || styles.normal;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pinnedAnnouncements = announcements.filter(a => a.is_pinned);
  const regularAnnouncements = announcements.filter(a => !a.is_pinned);
  const unreadCount = announcements.filter(a => !a.is_read).length;

  const filteredAnnouncements = filter === 'all'
    ? regularAnnouncements
    : filter === 'unread'
      ? regularAnnouncements.filter(a => !a.is_read)
      : regularAnnouncements.filter(a => a.priority === filter);

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
          Loading announcements...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>📢 Announcements</h1>
        <p>Stay informed with university updates and notifications</p>
        {unreadCount > 0 && (
          <span style={{
            background: '#ef4444',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            marginLeft: '12px'
          }}>
            {unreadCount} unread
          </span>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['all', 'unread', 'urgent', 'high', 'normal'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              background: filter === f ? '#3b82f6' : '#f3f4f6',
              color: filter === f ? 'white' : '#374151',
              fontWeight: '500',
              textTransform: 'capitalize',
              fontSize: '0.9rem'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className={styles.pageContent}>
        {/* Pinned Announcements */}
        {pinnedAnnouncements.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '16px' }}>
              📌 Pinned Announcements
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pinnedAnnouncements.map(announcement => {
                const priorityStyle = getPriorityStyle(announcement.priority);
                const isExpanded = expandedId === announcement.announcement_id;

                return (
                  <div
                    key={announcement.announcement_id}
                    onClick={() => toggleExpand(announcement.announcement_id)}
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      borderLeft: `4px solid ${priorityStyle.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          {!announcement.is_read && (
                            <span style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: '#3b82f6'
                            }}></span>
                          )}
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            background: priorityStyle.bg,
                            color: priorityStyle.color,
                            textTransform: 'uppercase'
                          }}>
                            {announcement.priority}
                          </span>
                          <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>
                            {announcement.title}
                          </h3>
                        </div>
                        <p style={{
                          margin: 0,
                          color: '#4b5563',
                          fontSize: '0.9rem',
                          lineHeight: '1.5',
                          display: isExpanded ? 'block' : '-webkit-box',
                          WebkitLineClamp: isExpanded ? 'unset' : 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: isExpanded ? 'visible' : 'hidden'
                        }}>
                          {announcement.content}
                        </p>
                        {announcement.deadline && (
                          <div style={{ marginTop: '8px', color: '#ef4444', fontSize: '0.85rem' }}>
                            ⏰ Deadline: {formatDate(announcement.deadline)} at {formatTime(announcement.deadline)}
                          </div>
                        )}
                      </div>
                      <span style={{ color: '#9ca3af', fontSize: '0.8rem', whiteSpace: 'nowrap', marginLeft: '16px' }}>
                        {formatDate(announcement.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Regular Announcements */}
        <div>
          <h2 style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '16px' }}>
            Latest Announcements
          </h2>

          {filteredAnnouncements.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              background: '#f9fafb',
              borderRadius: '12px',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📭</div>
              <p>No announcements found</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredAnnouncements.map(announcement => {
                const priorityStyle = getPriorityStyle(announcement.priority);
                const isExpanded = expandedId === announcement.announcement_id;

                return (
                  <div
                    key={announcement.announcement_id}
                    onClick={() => toggleExpand(announcement.announcement_id)}
                    style={{
                      background: announcement.is_read ? '#fafafa' : 'white',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      boxShadow: announcement.is_read ? 'none' : '0 2px 8px rgba(0,0,0,0.08)',
                      borderLeft: `4px solid ${priorityStyle.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      border: announcement.is_read ? '1px solid #e5e7eb' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          {!announcement.is_read && (
                            <span style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: '#3b82f6'
                            }}></span>
                          )}
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            background: priorityStyle.bg,
                            color: priorityStyle.color,
                            textTransform: 'uppercase'
                          }}>
                            {announcement.priority}
                          </span>
                          <h3 style={{
                            margin: 0,
                            fontSize: '1rem',
                            color: announcement.is_read ? '#6b7280' : '#1e293b'
                          }}>
                            {announcement.title}
                          </h3>
                        </div>
                        <p style={{
                          margin: 0,
                          color: '#4b5563',
                          fontSize: '0.9rem',
                          lineHeight: '1.5',
                          display: isExpanded ? 'block' : '-webkit-box',
                          WebkitLineClamp: isExpanded ? 'unset' : 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: isExpanded ? 'visible' : 'hidden'
                        }}>
                          {announcement.content}
                        </p>
                        {announcement.deadline && (
                          <div style={{ marginTop: '8px', color: '#ef4444', fontSize: '0.85rem' }}>
                            ⏰ Deadline: {formatDate(announcement.deadline)} at {formatTime(announcement.deadline)}
                          </div>
                        )}
                      </div>
                      <span style={{ color: '#9ca3af', fontSize: '0.8rem', whiteSpace: 'nowrap', marginLeft: '16px' }}>
                        {formatDate(announcement.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Announcements;
