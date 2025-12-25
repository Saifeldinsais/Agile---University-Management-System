import { useState, useEffect } from "react";
import axios from "axios";
import styles from "./DoctorDashboard.module.css";

const API = "http://localhost:5000";

function DoctorDashboard() {
  const [doctor, setDoctor] = useState(null);
  const [courses, setCourses] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [pendingGrading, setPendingGrading] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const doctorId = localStorage.getItem("userId");
      
      setDoctor(userData);

      // Load courses
      const coursesRes = await axios.get(`${API}/api/doctor/courses/${doctorId}`);
      const coursesList = coursesRes.data.data || [];
      setCourses(coursesList);

      // Mock upcoming deadlines
      setUpcomingDeadlines([]);

      // Mock pending grading
      setPendingGrading([]);

      // Mock upcoming meetings
      setUpcomingMeetings([]);

      // Mock recent messages
      setRecentMessages([]);
    } catch (err) {
      console.error("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loadingBox}>Loading dashboard...</div>;
  }

  return (
    <div className={styles.dashboard}>
      {/* Welcome Banner */}
      <div className={styles.welcomeBanner}>
        <h1>Welcome back, {doctor?.fullName || "Doctor"}</h1>
        <p>Here's your academic overview for today</p>
      </div>

      {/* Quick Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📚</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Active Courses</div>
            <div className={styles.statValue}>{courses.length}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>⏰</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Pending Deadlines</div>
            <div className={styles.statValue}>{upcomingDeadlines.length}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✏️</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Pending Grading</div>
            <div className={styles.statValue}>{pendingGrading.reduce((sum, p) => sum + p.count, 0)}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🕐</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Upcoming Meetings</div>
            <div className={styles.statValue}>{upcomingMeetings.length}</div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className={styles.contentGrid}>
        {/* Assigned Courses */}
        <div className={styles.card}>
          <h2>Assigned Courses</h2>
          {courses.length === 0 ? (
            <p className={styles.emptyText}>No courses assigned</p>
          ) : (
            <div className={styles.courseList}>
              {courses.slice(0, 4).map((course) => (
                <div key={course.id || course.entity_id} className={styles.courseItem}>
                  <div className={styles.courseCode}>{course.code || "COURSE"}</div>
                  <div className={styles.courseTitle}>{course.title || "Untitled"}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className={styles.card}>
          <h2>Upcoming Assessment Deadlines</h2>
          <div className={styles.itemList}>
            {upcomingDeadlines.map((item) => (
              <div key={item.id} className={styles.listItem}>
                <div className={styles.itemContent}>
                  <div className={styles.itemTitle}>{item.title}</div>
                  <div className={styles.itemMeta}>{item.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Grading */}
        <div className={styles.card}>
          <h2>Pending Grading Tasks</h2>
          <div className={styles.itemList}>
            {pendingGrading.map((item) => (
              <div key={item.id} className={styles.listItem}>
                <div className={styles.itemContent}>
                  <div className={styles.itemTitle}>{item.assessment}</div>
                  <div className={styles.itemMeta}>{item.course} • {item.count} submissions</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className={styles.card}>
          <h2>Upcoming Meetings & Office Hours</h2>
          <div className={styles.itemList}>
            {upcomingMeetings.map((item) => (
              <div key={item.id} className={styles.listItem}>
                <div className={styles.itemContent}>
                  <div className={styles.itemTitle}>{item.title}</div>
                  <div className={styles.itemMeta}>{item.time} • {item.count} participant(s)</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Messages */}
        <div className={styles.card}>
          <h2>Recent Messages & Announcements</h2>
          <div className={styles.itemList}>
            {recentMessages.map((item) => (
              <div key={item.id} className={styles.listItem}>
                <div className={styles.itemContent}>
                  <div className={styles.itemTitle}>From: {item.from}</div>
                  <div className={styles.itemMeta}>{item.subject}</div>
                  <div className={styles.itemPreview}>{item.preview}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DoctorDashboard;
