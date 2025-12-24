import { useState, useEffect } from "react";
import styles from "./StudentPages.module.css";

function Announcements() {
  useEffect(() => {
    document.title = 'Announcements - News & Updates';
  }, []);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>📢 Announcements</h1>
        <p>Stay informed with global, departmental, and course-specific announcements</p>
      </div>

      <div className={styles.pageContent}>
        <div className={styles.section}>
          <h2>Announcements & Notifications</h2>
          <p style={{ color: '#6b7280' }}>
            Receive important updates and notifications about deadlines, grade releases, 
            and academic announcements relevant to your courses and department.
          </p>
          
          <div className={styles.featureList}>
            <div className={styles.feature}>
              <h3>🌍 Global Announcements</h3>
              <p>University-wide announcements and updates</p>
            </div>
            <div className={styles.feature}>
              <h3>🏢 Department Updates</h3>
              <p>Department-specific announcements</p>
            </div>
            <div className={styles.feature}>
              <h3>📚 Course Announcements</h3>
              <p>Course-specific announcements from instructors</p>
            </div>
            <div className={styles.feature}>
              <h3>🔔 Notifications</h3>
              <p>Real-time notifications for important events</p>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Notification Types</h2>
          <div style={{ color: '#6b7280' }}>
            <p><strong>Deadline Alerts:</strong> Receive notifications for upcoming assignment and exam deadlines</p>
            <p><strong>Grade Releases:</strong> Get notified when your grades are released</p>
            <p><strong>Academic Updates:</strong> Important academic calendar and policy changes</p>
            <p><strong>Course Updates:</strong> Course-specific announcements from instructors</p>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Features Coming Soon</h2>
          <ul style={{ color: '#6b7280', lineHeight: '1.8' }}>
            <li>✓ Centralized announcements feed</li>
            <li>✓ Filter by announcement type</li>
            <li>✓ Search announcements</li>
            <li>✓ Mark announcements as read</li>
            <li>✓ Archive announcements</li>
            <li>✓ Real-time notification system</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Announcements;
