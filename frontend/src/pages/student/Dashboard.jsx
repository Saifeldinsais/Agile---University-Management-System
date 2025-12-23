import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL } from "../../services/config";
import StudentService from "../../services/studentService";
import socketService from "../../services/socketService";
import Course from "./Course/Course";
import EnrolledCourse from "./EnrolledCourse/EnrolledCourse";

import styles from "./Dashboard.module.css";

function Dashboard() {

  const [refreshEnrolled, setRefreshEnrolled] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'courses'

  // Set page title
  useEffect(() => {
    document.title = 'Student Dashboard - Academic Overview';
  }, []);

  const [student, _setStudent] = useState(() => { //getStudent
    // Try 'user' first (new key), then 'student' (old key)
    const storedUser = localStorage.getItem("user") || localStorage.getItem("student");
    if (!storedUser) {
      return null;
    }
    try {
      return JSON.parse(storedUser);
    } catch (err) {
      console.error('Failed to parse stored user:', err);
      localStorage.removeItem('user');
      localStorage.removeItem('student');
      return null;
    }
  });

  const [courses, setCourses] = useState([]);

  // Socket.io connection for real-time updates
  useEffect(() => {
    socketService.connect();
    socketService.joinRoom("student");

    // Listen for enrollment updates (admin approve/reject)
    const handleEnrollmentUpdated = (data) => {
      console.log("Enrollment status updated:", data);

      // Update local enrolled courses
      setEnrolled((prev) =>
        prev.map((e) =>
          e.enrollmentId === data.enrollmentId
            ? { ...e, status: data.status.toLowerCase() }
            : e
        )
      );

      // Show notification
      const message = data.action === "APPROVE"
        ? "Your enrollment has been approved! 🎉"
        : `Your enrollment was rejected. ${data.note ? `Reason: ${data.note}` : ''}`;

      setNotification({ message, type: data.action === "APPROVE" ? "success" : "error" });
      setTimeout(() => setNotification(null), 5000);
    };

    socketService.on("enrollment-updated", handleEnrollmentUpdated);

    return () => {
      socketService.off("enrollment-updated", handleEnrollmentUpdated);
    };
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        console.log('Fetching courses from:', `${API_BASE_URL}/student/viewCourses`);
        const res = await fetch(`${API_BASE_URL}/student/viewCourses`);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.log('Courses fetched:', data);
        setCourses(data);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setCourses([]); // Set empty array on error
      }
    };

    fetchCourses();
  }, []); // Remove student dependency to always fetch courses


  const handleEnroll = async (courseId) => {
    if (!student?.id) {
      alert("No student logged in.");
      return;
    }

    try {
      const res = await StudentService.enrollCourse(student.id, courseId);

      if (res.status === 200 || res.status === 201) {
        alert("Successfully enrolled in course!");
        setRefreshEnrolled(prev => !prev)
      }
      else {
        alert("Enrollment failed.");
      }
    } catch (err) {
      console.error(err);
      if (err.status === 400) {
        alert("Student Already Enrolled")
      }
      else {
        alert("Error enrolling in course.");
      }
    }
  };
  const handleDrop = async (courseId) => {
    if (!student?.id) {
      alert("No student logged in.");
      return;
    }

    try {
      const res = await StudentService.dropCourse(student.id, courseId);

      if (res.status === 200 || res.status === 201) {
        alert("Successfully Requested to drop course!");
        setRefreshEnrolled(prev => !prev)
      }
      else {
        alert("Request failed.");
      }
    } catch (err) {
      console.error(err);
      if (err.status === 400) {
        alert("Student Already Requested Drop")
      }
      else {
        alert("Error Dropping the course.");
      }
    }
  };

  const [enrolled, setEnrolled] = useState([]);

  useEffect(() => {
    const fetchEnrolled = async () => {
      if (!student?.id) return;

      try {
        const res = await fetch(`${API_BASE_URL}/student/enrolled/${student.id}`);
        const data = await res.json();

        setEnrolled(data.courses || []);
      } catch (err) {
        console.error("Error fetching enrolled courses:", err);
      }
    };

    fetchEnrolled();
  }, [student, refreshEnrolled]);

  // Compute available courses (filter out enrolled ones)
  const availableCourses = useMemo(() => {
    const enrolledCourseIds = enrolled.map(e => parseInt(e.courseId));
    return courses.filter(course => !enrolledCourseIds.includes(parseInt(course._id)));
  }, [courses, enrolled]);

  // Calculate academic statistics from enrolled courses
  const academicStats = useMemo(() => {
    const totalCredits = enrolled.reduce((sum, course) => sum + (parseInt(course.credits) || 0), 0);
    const completedCourses = enrolled.filter(c => c.status?.toLowerCase() === 'approved').length;
    const pendingCourses = enrolled.filter(c => c.status?.toLowerCase() === 'pending').length;
    
    // Calculate average grade from approved courses only
    const approvedCourses = enrolled.filter(c => 
      c.status?.toLowerCase() === 'approved' && c.grade != null && c.grade !== '' && !isNaN(c.grade)
    );
    const averageGrade = approvedCourses.length > 0
      ? (approvedCourses.reduce((sum, c) => sum + parseFloat(c.grade), 0) / approvedCourses.length).toFixed(1)
      : '--';
    
    return {
      totalEnrolled: enrolled.length,
      completedCourses,
      pendingCourses,
      totalCredits,
      averageGrade,
    };
  }, [enrolled]);

  // Get upcoming deadlines - dynamically based on enrolled courses
  const upcomingDeadlines = useMemo(() => {
    // Generate mock deadlines based on enrolled courses (simulating real deadline system)
    // In a real app, this would fetch from an assignments/deadlines API
    return enrolled
      .filter(c => c.status?.toLowerCase() === 'approved')
      .slice(0, 3)
      .map((course, idx) => {
        const dayOffset = Math.floor(Math.random() * 14) + 2; // Random deadline between 2-15 days
        return {
          id: `${course.enrollmentId}-${idx}`,
          course: course.title,
          assignment: `${course.code} - Assignment ${idx + 1}`,
          dueDate: new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000),
        };
      });
  }, [enrolled]);

  // Get recent notifications based on actual enrollment status
  const recentNotifications = useMemo(() => {
    const notifications = [];
    
    // Check for pending enrollments
    const pendingEnrollments = enrolled.filter(c => c.status?.toLowerCase() === 'pending');
    if (pendingEnrollments.length > 0) {
      notifications.push({
        id: 'pending',
        title: 'Enrollment Pending',
        message: `You have ${pendingEnrollments.length} course(s) awaiting approval from your advisor`,
        type: 'info',
      });
    }
    
    // Welcome notification
    notifications.push({
      id: 'welcome',
      title: 'Welcome to Student Dashboard',
      message: 'All your academic activities in one place',
      type: 'success',
    });

    // Course progress notification
    if (enrolled.length > 0) {
      const approvedCount = enrolled.filter(c => c.status?.toLowerCase() === 'approved').length;
      if (approvedCount > 0) {
        notifications.push({
          id: 'progress',
          title: 'Course Progress',
          message: `You are enrolled in ${approvedCount} active course(s)`,
          type: 'success',
        });
      }
    }
    
    return notifications;
  }, [enrolled]);

  return (
    <>
      {/* Real-time notification toast */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          padding: '16px 24px',
          borderRadius: 12,
          backgroundColor: notification.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: notification.type === 'success' ? '#065f46' : '#991b1b',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          zIndex: 9999,
          animation: 'slideIn 0.3s ease-out',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <span style={{ fontSize: 20 }}>{notification.type === 'success' ? '✓' : '✗'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      <div className={styles.dashboardContainer}>
        {/* Welcome Header */}
        <div className={styles.welcomeSection}>
          <div className={styles.welcomeContent}>
            <h1>Welcome back, {student?.name || student?.username || 'Student'}!</h1>
            <p>Your centralized dashboard for all academic activities</p>
            <div className={styles.studentInfo}>
              <span>{student?.email || 'Not available'}</span>
              {student?.id && <span>Student ID: {student.id}</span>}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNavigation}>
          <button
            className={`${styles.tabButton} ${activeTab === 'overview' ? styles.active : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'courses' ? styles.active : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            Courses
          </button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className={styles.overviewTab}>
            {/* Academic Summary Cards */}
            <section className={styles.section}>
              <h2>Academic Summary</h2>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>1</div>
                  <div className={styles.statContent}>
                    <h3>{academicStats.totalEnrolled}</h3>
                    <p>Enrolled Courses</p>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statNumber}>2</div>
                  <div className={styles.statContent}>
                    <h3>{academicStats.completedCourses}</h3>
                    <p>Approved Courses</p>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statNumber}>3</div>
                  <div className={styles.statContent}>
                    <h3>{academicStats.pendingCourses}</h3>
                    <p>Pending Approvals</p>\n                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statNumber}>4</div>
                  <div className={styles.statContent}>
                    <h3>{academicStats.totalCredits}</h3>
                    <p>Total Credits</p>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statNumber}>5</div>
                  <div className={styles.statContent}>
                    <h3>{academicStats.averageGrade}</h3>
                    <p>Average Grade</p>
                    {academicStats.averageGrade !== '--' && (
                      <small style={{ opacity: 0.7 }}>
                        ({enrolled.filter(c => c.status?.toLowerCase() === 'approved' && c.grade != null).length} courses)
                      </small>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <div className={styles.twoColumnLayout}>
              {/* Upcoming Deadlines */}
              <section className={styles.section}>
                <h2>Upcoming Deadlines</h2>
                <div className={styles.deadlinesList}>
                  {upcomingDeadlines.length > 0 ? (
                    upcomingDeadlines.map((deadline) => (
                      <div key={deadline.id} className={styles.deadlineItem}>
                        <div className={styles.deadlineLeft}>
                          <h4>{deadline.assignment}</h4>
                          <p className={styles.courseName}>{deadline.course}</p>
                        </div>
                        <div className={styles.deadlineRight}>
                          <span className={styles.dueDate}>
                            {deadline.dueDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: deadline.dueDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                            })}
                          </span>
                          <small style={{ color: '#6b7280', display: 'block', marginTop: '4px' }}>
                            {Math.ceil((deadline.dueDate - new Date()) / (1000 * 60 * 60 * 24))} days away
                          </small>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={styles.emptyState}>No upcoming deadlines</p>
                  )}
                </div>
              </section>

              {/* Recent Notifications */}
              <section className={styles.section}>
                <h2>Recent Notifications</h2>
                <div className={styles.notificationsList}>
                  {recentNotifications.length > 0 ? (
                    recentNotifications.map((notif) => (
                      <div key={notif.id} className={`${styles.notificationItem} ${styles[notif.type]}`}>
                        <div className={styles.notificationIcon}>
                          {notif.type === 'success' ? '✓' : 'ℹ'}
                        </div>
                        <div className={styles.notificationContent}>
                          <h4>{notif.title}</h4>
                          <p>{notif.message}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={styles.emptyState}>No notifications</p>
                  )}
                </div>
              </section>
            </div>

            {/* Quick Access */}
            <section className={styles.section}>
              <h2>Quick Access</h2>
              <div className={styles.quickAccessGrid}>
                <button className={styles.quickAccessCard} onClick={() => setActiveTab('courses')}>
                  <div className={styles.qaIcon}>▶</div>
                  <h3>My Courses</h3>
                  <p>View and manage your enrolled courses</p>
                </button>
                <div className={styles.quickAccessCard} style={{ cursor: 'default' }}>
                  <div className={styles.qaIcon}>▶</div>
                  <h3>Assessments</h3>
                  <p>View your grades and assessments</p>
                  <span className={styles.soon}>Coming Soon</span>
                </div>
                <div className={styles.quickAccessCard} style={{ cursor: 'default' }}>
                  <div className={styles.qaIcon}>▶</div>
                  <h3>Announcements</h3>
                  <p>Stay updated with course announcements</p>
                  <span className={styles.soon}>Coming Soon</span>
                </div>
                <div className={styles.quickAccessCard} style={{ cursor: 'default' }}>
                  <div className={styles.qaIcon}>▶</div>
                  <h3>Facility Services</h3>
                  <p>Access library, lab, and other services</p>
                  <span className={styles.soon}>Coming Soon</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* COURSES TAB */}
        {activeTab === 'courses' && (
          <div className={styles.coursesTab}>
            <div className={styles.coursesSectionContent}>
              <h2>Available Courses</h2>
              <div className={styles.coursesContainer}>
                {/* Show available courses that aren't enrolled */}
                {availableCourses.map((e) => (
                  <Course
                    title={e.title || "error"}
                    code={e.code || "error"}
                    description={e.description || "error"}
                    credits={e.credits || "NaN"}
                    department={e.department || "error"}
                    onEnroll={() => handleEnroll(e._id)}
                    key={e._id}
                  />
                ))}

                {/* Empty state for available courses */}
                {availableCourses.length === 0 && (
                  <p style={{ color: '#6b7280', padding: '20px', textAlign: 'center', gridColumn: '1 / -1' }}>
                    {courses.length === 0 ? 'No courses available.' : 'You are enrolled in all available courses!'}
                  </p>
                )}
              </div>
            </div>

            <div className={styles.coursesSectionContent}>
              <h2>Your Courses</h2>
              <div className={styles.enrolledCourses}>
                {enrolled.map((e) => (
                  <EnrolledCourse
                    key={e.enrollmentId}
                    course={{
                      title: e.title,
                      code: e.code,
                      credits: e.credits,
                      department: e.department,
                      _id: e.courseId
                    }}
                    status={e.status}
                    grade={e.grade}
                    onDrop={() => handleDrop(e.courseId)}
                  />
                ))}

                {/* Empty state for enrolled courses */}
                {enrolled.length === 0 && (
                  <p style={{ color: '#6b7280', padding: '20px', textAlign: 'center', gridColumn: '1 / -1' }}>
                    You haven't enrolled in any courses yet. Browse available courses above!
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Dashboard;
