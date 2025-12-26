import { useState, useEffect } from "react";
import axios from "axios";
import styles from "./DoctorDashboard.module.css";

const API = "http://localhost:5000";

// Clean SVG Icons
const Icons = {
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
};

function DoctorDashboard() {
  const [doctor, setDoctor] = useState(null);
  const [courses, setCourses] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [pendingGrading, setPendingGrading] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
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

      // These would be loaded from real endpoints
      setUpcomingDeadlines([]);
      setPendingGrading([]);
      setUpcomingMeetings([]);
    } catch (err) {
      console.error("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = pendingGrading.reduce((sum, p) => sum + p.count, 0);

  if (loading) {
    return <div className={styles.loadingBox}>Loading...</div>;
  }

  return (
    <div className={styles.dashboard}>
      {/* Welcome Section */}
      <div className={styles.welcomeBanner}>
        <h1>Welcome, {doctor?.fullName || "Doctor"}</h1>
        <p>Manage your courses, assessments, and student interactions</p>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.courses}`}>
            {Icons.book}
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Active Courses</div>
            <div className={styles.statValue}>{courses.length}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.deadlines}`}>
            {Icons.clock}
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Pending Deadlines</div>
            <div className={styles.statValue}>{upcomingDeadlines.length}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.grading}`}>
            {Icons.edit}
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>To Grade</div>
            <div className={styles.statValue}>{pendingCount}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.meetings}`}>
            {Icons.calendar}
          </div>
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
          <h2>Your Courses</h2>
          {courses.length === 0 ? (
            <p className={styles.emptyText}>No courses assigned</p>
          ) : (
            <div className={styles.courseList}>
              {courses.slice(0, 5).map((course) => (
                <div key={course.id || course.entity_id} className={styles.courseItem}>
                  <div className={styles.courseCode}>{course.code || "COURSE"}</div>
                  <div className={styles.courseTitle}>{course.title || "Untitled"}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines - Only show if there are items */}
        {upcomingDeadlines.length > 0 && (
          <div className={styles.card}>
            <h2>Upcoming Deadlines</h2>
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
        )}

        {/* Pending Grading - Only show if there are items */}
        {pendingGrading.length > 0 && (
          <div className={styles.card}>
            <h2>Pending Grading</h2>
            <div className={styles.itemList}>
              {pendingGrading.map((item) => (
                <div key={item.id} className={styles.listItem}>
                  <div className={styles.itemContent}>
                    <div className={styles.itemTitle}>{item.assessment}</div>
                    <div className={styles.itemMeta}>{item.course} · {item.count} submissions</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Meetings - Only show if there are items */}
        {upcomingMeetings.length > 0 && (
          <div className={styles.card}>
            <h2>Upcoming Meetings</h2>
            <div className={styles.itemList}>
              {upcomingMeetings.map((item) => (
                <div key={item.id} className={styles.listItem}>
                  <div className={styles.itemContent}>
                    <div className={styles.itemTitle}>{item.title}</div>
                    <div className={styles.itemMeta}>{item.time} · {item.count} participant(s)</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorDashboard;
