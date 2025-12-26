import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL } from "../../services/config";
import StudentService from "../../services/studentService";
import socketService from "../../services/socketService";
import Course from "./Course/Course";
import EnrolledCourse from "./EnrolledCourse/EnrolledCourse";
import CompletedCourses from "./CompletedCourses/CompletedCourses";

import styles from "./Dashboard.module.css";

function Dashboard() {
  const [refreshEnrolled, setRefreshEnrolled] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' or 'courses'

  const [assignments, setAssignments] = useState([]);
  const [completedCoursesData, setCompletedCoursesData] = useState({
    completedCourses: [],
    gpa: 0,
    totalCredits: 0,
  });

  // Set page title
  useEffect(() => {
    document.title = "Student Dashboard - Academic Overview";
  }, []);

  const [student, _setStudent] = useState(() => {
    const storedUser =
      localStorage.getItem("user") || localStorage.getItem("student");
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser);
    } catch (err) {
      console.error("Failed to parse stored user:", err);
      localStorage.removeItem("user");
      localStorage.removeItem("student");
      return null;
    }
  });

  const [courses, setCourses] = useState([]);
  const [enrolled, setEnrolled] = useState([]);

  // Socket.io connection for real-time updates
  useEffect(() => {
    socketService.connect();
    socketService.joinRoom("student");

    const handleEnrollmentUpdated = (data) => {
      console.log("Enrollment status updated:", data);

      setEnrolled((prev) =>
        prev.map((e) =>
          e.enrollmentId === data.enrollmentId
            ? { ...e, status: data.status.toLowerCase() }
            : e
        )
      );

      const message =
        data.action === "APPROVE"
          ? "Your enrollment has been approved."
          : `Your enrollment was rejected. ${data.note ? `Reason: ${data.note}` : ""}`;

      setNotification({
        message,
        type: data.action === "APPROVE" ? "success" : "error",
      });
      setTimeout(() => setNotification(null), 5000);
    };

    // ✅ optional: if you emit assignment-created from backend, this refreshes
    const handleAssignmentCreated = (data) => {
      // data: { courseId } (or whatever you emit)
      // We’ll just re-fetch assignments.
      console.log("Assignment created:", data);
      // trigger fetch by calling function inline (we’ll call fetchAssignments below via dependency)
      setRefreshEnrolled((p) => !p);
    };

    socketService.on("enrollment-updated", handleEnrollmentUpdated);
    socketService.on("assignment-created", handleAssignmentCreated);

    return () => {
      socketService.off("enrollment-updated", handleEnrollmentUpdated);
      socketService.off("assignment-created", handleAssignmentCreated);
    };
  }, []);

  // Fetch completed courses data
  useEffect(() => {
    const fetchCompletedCourses = async () => {
      if (!student?.id) return;

      try {
        const res = await fetch(
          `${API_BASE_URL}/student/completed-courses/${student.id}`
        );
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setCompletedCoursesData({
          completedCourses: data.completedCourses || [],
          gpa: data.gpa || 0,
          totalCredits: data.totalCredits || 0,
        });
      } catch (err) {
        console.error("Error fetching completed courses:", err);
        setCompletedCoursesData({
          completedCourses: [],
          gpa: 0,
          totalCredits: 0,
        });
      }
    };

    fetchCompletedCourses();
  }, [student?.id]);

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/student/viewCourses`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setCourses([]);
      }
    };

    fetchCourses();
  }, []);

  const handleEnroll = async (courseId) => {
    if (!student?.id) {
      alert("No student logged in.");
      return;
    }

    try {
      const res = await StudentService.enrollCourse(student.id, courseId);

      if (res.status === 200 || res.status === 201) {
        alert("Successfully enrolled in course!");
        setRefreshEnrolled((prev) => !prev);
      } else {
        alert("Enrollment failed.");
      }
    } catch (err) {
      console.error(err);
      if (err.status === 400) alert("Student Already Enrolled");
      else alert("Error enrolling in course.");
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
        setRefreshEnrolled((prev) => !prev);
      } else {
        alert("Request failed.");
      }
    } catch (err) {
      console.error(err);
      if (err.status === 400) alert("Student Already Requested Drop");
      else alert("Error Dropping the course.");
    }
  };

  // Fetch enrolled courses
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

  // ✅ NEW: Fetch assignments for approved enrolled courses
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const approved = enrolled.filter(
          (c) => c.status?.toLowerCase() === "approved"
        );

        if (approved.length === 0) {
          setAssignments([]);
          return;
        }

        // IMPORTANT: this route must exist in backend:
        // GET /student/courses/:courseId/assignments
        const responses = await Promise.all(
          approved.map((c) =>
            fetch(`${API_BASE_URL}/student/courses/${c.courseId}/assignments`)
              .then((r) => r.json())
              .catch(() => ({}))
          )
        );

        // flatten assignments
        const all = responses.flatMap((r) => r.assignments || r.data || []);

        // normalize
        const normalized = all
          .map((a) => ({
            ...a,
            dueDateObj: a.dueDate ? new Date(a.dueDate) : null,
          }))
          .filter((a) => a.dueDateObj && !isNaN(a.dueDateObj));

        setAssignments(normalized);
      } catch (err) {
        console.error("Error fetching assignments:", err);
        setAssignments([]);
      }
    };

    fetchAssignments();
  }, [enrolled]);

  // Compute available courses (filter out enrolled ones)
  const availableCourses = useMemo(() => {
    const enrolledCourseIds = enrolled.map((e) => parseInt(e.courseId));
    return courses.filter(
      (course) => !enrolledCourseIds.includes(parseInt(course._id))
    );
  }, [courses, enrolled]);

  // course lookup map for prettier deadlines display
  const courseById = useMemo(() => {
    const m = new Map();
    (courses || []).forEach((c) => m.set(String(c._id), c));
    return m;
  }, [courses]);

  // Calculate academic statistics from enrolled courses
  const academicStats = useMemo(() => {
    // Only count credits from approved/active enrolled courses
    const totalCredits = enrolled.reduce(
      (sum, course) => sum + (parseInt(course.credits) || 0),
      0
    );

    const completedCourses = enrolled.filter(
      (c) => c.status?.toLowerCase() === "approved"
    ).length;

    const pendingCourses = enrolled.filter(
      (c) => c.status?.toLowerCase() === "pending"
    ).length;

    const approvedCourses = enrolled.filter(
      (c) =>
        c.status?.toLowerCase() === "approved" &&
        c.grade != null &&
        c.grade !== "" &&
        !isNaN(c.grade)
    );

    const averageGrade =
      approvedCourses.length > 0
        ? (
          approvedCourses.reduce((sum, c) => sum + parseFloat(c.grade), 0) /
          approvedCourses.length
        ).toFixed(1)
        : "--";

    return {
      totalEnrolled: enrolled.length,
      completedCourses,
      pendingCourses,
      totalCredits, // This is for active enrolled courses
      averageGrade,
    };
  }, [enrolled]);

  // ✅ UPDATED: Upcoming Deadlines from real assignments (not random)
  const upcomingDeadlines = useMemo(() => {
    const now = new Date();

    return assignments
      .filter((a) => (a.status || "active").toLowerCase() === "active")
      .filter((a) => a.dueDateObj >= now)
      .sort((a, b) => a.dueDateObj - b.dueDateObj)
      .slice(0, 3)
      .map((a) => {
        const c = courseById.get(String(a.courseId));
        const courseTitle = c?.title || a.courseTitle || a.courseId;
        const courseCode = c?.code || a.courseCode || "";

        return {
          id: a.assignmentId || `${a.courseId}-${a.title}-${a.dueDate}`,
          course: courseTitle,
          assignment: `${courseCode ? courseCode + " - " : ""}${a.title}`,
          dueDate: a.dueDateObj,
          type: a.type || "assignment",
          totalMarks: a.totalMarks,
        };
      });
  }, [assignments, courseById]);

  // Get recent notifications based on actual enrollment status
  const recentNotifications = useMemo(() => {
    const notifications = [];

    const pendingEnrollments = enrolled.filter(
      (c) => c.status?.toLowerCase() === "pending"
    );
    if (pendingEnrollments.length > 0) {
      notifications.push({
        id: "pending",
        title: "Enrollment Pending",
        message: `You have ${pendingEnrollments.length} course(s) awaiting approval from your advisor`,
        type: "info",
      });
    }

    notifications.push({
      id: "welcome",
      title: "Welcome to Student Dashboard",
      message: "All your academic activities in one place",
      type: "success",
    });

    if (enrolled.length > 0) {
      const approvedCount = enrolled.filter(
        (c) => c.status?.toLowerCase() === "approved"
      ).length;
      if (approvedCount > 0) {
        notifications.push({
          id: "progress",
          title: "Course Progress",
          message: `You are enrolled in ${approvedCount} active course(s)`,
          type: "success",
        });
      }
    }

    return notifications;
  }, [enrolled]);

  return (
    <>
      {/* Real-time notification toast */}
      {notification && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            padding: "16px 24px",
            borderRadius: 12,
            backgroundColor:
              notification.type === "success" ? "#d1fae5" : "#fee2e2",
            color: notification.type === "success" ? "#065f46" : "#991b1b",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            zIndex: 9999,
            animation: "slideIn 0.3s ease-out",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>{notification.message}</span>
        </div>
      )}

      <div className={styles.dashboardContainer}>
        {/* Welcome Header */}
        <div className={styles.welcomeSection}>
          <div className={styles.welcomeContent}>
            <h1>
              Welcome, {student?.name || student?.username || "Student"}
            </h1>
            <p>Academic overview and course management</p>
            <div className={styles.studentInfo}>
              <span>{student?.email || "Not available"}</span>
              {student?.id && <span>Student ID: {student.id}</span>}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNavigation}>
          <button
            className={`${styles.tabButton} ${activeTab === "overview" ? styles.active : ""
              }`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === "courses" ? styles.active : ""
              }`}
            onClick={() => setActiveTab("courses")}
          >
            Courses
          </button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className={styles.overviewTab}>
            {/* Academic Summary Cards */}
            <section className={styles.section}>
              <h2>Academic Summary</h2>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statContent}>
                    <h3>{academicStats.totalEnrolled}</h3>
                    <p>Enrolled</p>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statContent}>
                    <h3>{academicStats.completedCourses}</h3>
                    <p>Approved</p>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statContent}>
                    <h3>{academicStats.pendingCourses}</h3>
                    <p>Pending</p>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statContent}>
                    <h3>{completedCoursesData.totalCredits}</h3>
                    <p>Credits</p>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statContent}>
                    <h3 style={{ color: "#1a56db" }}>{parseFloat(completedCoursesData.gpa).toFixed(2)}</h3>
                    <p>GPA</p>
                  </div>
                </div>
              </div>
            </section>

            <div className={styles.twoColumnLayout}>
              <section className={styles.section}>
                <h2>Upcoming Deadlines</h2>
                <div className={styles.deadlinesList}>
                  {upcomingDeadlines.length > 0 ? (
                    upcomingDeadlines.map((deadline) => (
                      <div key={deadline.id} className={styles.deadlineItem}>
                        <div className={styles.deadlineLeft}>
                          <h4>{deadline.assignment}</h4>
                          <p className={styles.courseName}>{deadline.course}</p>
                          {deadline.type && (
                            <small style={{ opacity: 0.7 }}>
                              Type: {deadline.type}
                              {deadline.totalMarks != null
                                ? ` • Marks: ${deadline.totalMarks}`
                                : ""}
                            </small>
                          )}
                        </div>
                        <div className={styles.deadlineRight}>
                          <span className={styles.dueDate}>
                            {deadline.dueDate.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year:
                                deadline.dueDate.getFullYear() !==
                                  new Date().getFullYear()
                                  ? "numeric"
                                  : undefined,
                            })}
                          </span>
                          <small
                            style={{
                              color: "#6b7280",
                              display: "block",
                              marginTop: "4px",
                            }}
                          >
                            {Math.ceil(
                              (deadline.dueDate - new Date()) /
                              (1000 * 60 * 60 * 24)
                            )}{" "}
                            days away
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
                      <div
                        key={notif.id}
                        className={`${styles.notificationItem} ${styles[notif.type]
                          }`}
                      >

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
              <h2>Quick Actions</h2>
              <div className={styles.quickAccessGrid}>
                <button
                  className={styles.quickAccessCard}
                  onClick={() => setActiveTab("courses")}
                >
                  <h3>Manage Courses</h3>
                  <p>Enroll, view, or drop courses</p>
                </button>
              </div>
            </section>
          </div>
        )}

        {/* COURSES TAB */}
        {activeTab === "courses" && (
          <div className={styles.coursesTab}>
            <div className={styles.coursesSectionContent}>
              <CompletedCourses studentId={student?.id} />
            </div>

            <div className={styles.coursesSectionContent}>
              <h2>Available Courses</h2>
              <div className={styles.coursesContainer}>
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

                {availableCourses.length === 0 && (
                  <p
                    style={{
                      color: "#6b7280",
                      padding: "20px",
                      textAlign: "center",
                      gridColumn: "1 / -1",
                    }}
                  >
                    {courses.length === 0
                      ? "No courses available."
                      : "You are enrolled in all available courses!"}
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
                      _id: e.courseId,
                    }}
                    status={e.status}
                    grade={e.grade}
                    onDrop={() => handleDrop(e.courseId)}
                  />
                ))}

                {enrolled.length === 0 && (
                  <p
                    style={{
                      color: "#6b7280",
                      padding: "20px",
                      textAlign: "center",
                      gridColumn: "1 / -1",
                    }}
                  >
                    You haven't enrolled in any courses yet. Browse available
                    courses above!
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
