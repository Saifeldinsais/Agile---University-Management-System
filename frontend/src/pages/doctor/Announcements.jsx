import { useState } from "react";
import styles from "./Announcements.module.css";

function DoctorAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    course: "CS101",
    content: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateAnnouncement = (e) => {
    e.preventDefault();
    const newAnnouncement = {
      id: announcements.length + 1,
      ...formData,
      date: new Date().toISOString().split("T")[0],
      pinned: false,
    };
    setAnnouncements([newAnnouncement, ...announcements]);
    setFormData({ title: "", course: "CS101", content: "" });
    setShowForm(false);
  };

  const handlePin = (id) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, pinned: !a.pinned } : a))
    );
  };

  const handleDelete = (id) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  const pinnedAnnouncements = announcements.filter((a) => a.pinned);
  const regularAnnouncements = announcements.filter((a) => !a.pinned);

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
        <form className={styles.form} onSubmit={handleCreateAnnouncement}>
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

          <div className={styles.formGroup}>
            <label>Course</label>
            <select
              name="course"
              value={formData.course}
              onChange={handleInputChange}
            >
              <option value="CS101">CS101: Intro to Programming</option>
              <option value="CS102">CS102: Data Structures</option>
              <option value="CS103">CS103: Web Development</option>
            </select>
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

          <button type="submit" className={styles.submitBtn}>
            Post Announcement
          </button>
        </form>
      )}

      {pinnedAnnouncements.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>📌 Pinned Announcements</h2>
          <div className={styles.announcementsList}>
            {pinnedAnnouncements.map((announcement) => (
              <div key={announcement.id} className={`${styles.announcementCard} ${styles.pinned}`}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3>{announcement.title}</h3>
                    <p className={styles.course}>{announcement.course}</p>
                  </div>
                  <span className={styles.date}>{announcement.date}</span>
                </div>

                <p className={styles.content}>{announcement.content}</p>

                <div className={styles.actions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handlePin(announcement.id)}
                  >
                    Unpin
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.delete}`}
                    onClick={() => handleDelete(announcement.id)}
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
          <p className={styles.empty}>No announcements yet</p>
        ) : (
          <div className={styles.announcementsList}>
            {regularAnnouncements.map((announcement) => (
              <div key={announcement.id} className={styles.announcementCard}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3>{announcement.title}</h3>
                    <p className={styles.course}>{announcement.course}</p>
                  </div>
                  <span className={styles.date}>{announcement.date}</span>
                </div>

                <p className={styles.content}>{announcement.content}</p>

                <div className={styles.actions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handlePin(announcement.id)}
                  >
                    Pin
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.delete}`}
                    onClick={() => handleDelete(announcement.id)}
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
