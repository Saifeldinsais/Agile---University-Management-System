import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./Dashboard.module.css";

const API = "http://localhost:5000";

function DoctorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Overview state
  const [doctor, setDoctor] = useState(null);
  const [courses, setCourses] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalAssignments, setTotalAssignments] = useState(0);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Courses tab state
  const [coursesList, setCoursesList] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [errorCourses, setErrorCourses] = useState(null);

  // Students tab state
  const [studentsList, setStudentsList] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [errorStudents, setErrorStudents] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Assignments tab state
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [errorAssignments, setErrorAssignments] = useState(null);

  const userId = useMemo(() => localStorage.getItem("userId"), []);
  const userData = useMemo(() => {
    const data = localStorage.getItem("user");
    return data ? JSON.parse(data) : null;
  }, []);

  const doctorId = userId || userData?.id;

  // ===== OVERVIEW TAB =====
  useEffect(() => {
    if (activeTab === "overview") {
      fetchOverviewData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchOverviewData = async () => {
    try {
      setLoadingOverview(true);

      if (!doctorId) {
        setDoctor(null);
        return;
      }

      // Set doctor info from localStorage
      setDoctor({
        name: userData?.fullName || userData?.name || "Doctor",
        email: userData?.email || "N/A",
        department: userData?.department || "N/A",
      });

      // Fetch courses
      const coursesRes = await axios.get(`${API}/api/doctor/courses/${doctorId}`);
      const coursesList = coursesRes.data.data || [];
      setCourses(coursesList);

      // Calculate statistics
      let totalStudentsCount = 0;
      let totalAssignmentsCount = 0;

      for (const course of coursesList) {
        try {
          const courseId = course.id || course.entity_id;

          // Count students
          const studentsRes = await axios.get(
            `${API}/api/doctor/courses/${courseId}/students`
          );
          totalStudentsCount += (studentsRes.data.data || []).length;

          // Count assignments
          const assignmentsRes = await axios.get(
            `${API}/api/doctor/courses/${courseId}/assignments`
          );
          totalAssignmentsCount += (assignmentsRes.data.data || []).length;
        } catch (err) {
          console.error(`Error fetching data for course ${course.id}:`, err);
        }
      }

      setTotalStudents(totalStudentsCount);
      setTotalAssignments(totalAssignmentsCount);
    } catch (err) {
      console.error("Error fetching overview data:", err);
    } finally {
      setLoadingOverview(false);
    }
  };

  // ===== COURSES TAB =====
  useEffect(() => {
    if (activeTab === "courses") {
      fetchCoursesData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchCoursesData = async () => {
    try {
      setLoadingCourses(true);
      setErrorCourses(null);

      if (!doctorId) {
        setErrorCourses("Doctor ID not found. Please login again.");
        return;
      }

      const res = await axios.get(`${API}/api/doctor/courses/${doctorId}`);
      if (res.data.status === "success") {
        setCoursesList(res.data.data || []);
      } else {
        setErrorCourses(res.data.message || "Failed to fetch courses");
      }
    } catch (err) {
      setErrorCourses(err.response?.data?.message || "Error fetching courses");
    } finally {
      setLoadingCourses(false);
    }
  };

  // ===== STUDENTS TAB =====
  useEffect(() => {
    if (activeTab === "students" && selectedCourseId) {
      fetchStudentsData();
    } else if (activeTab === "students" && !selectedCourseId && coursesList.length > 0) {
      setSelectedCourseId(String(coursesList[0].id || coursesList[0].entity_id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedCourseId]);

  useEffect(() => {
    if (activeTab === "students" && !selectedCourseId && coursesList.length > 0) {
      const firstId = String(coursesList[0].id || coursesList[0].entity_id);
      setSelectedCourseId(firstId);
    }
  }, [activeTab, coursesList]);

  const fetchStudentsData = async () => {
    if (!selectedCourseId) return;

    try {
      setLoadingStudents(true);
      setErrorStudents(null);

      const res = await axios.get(
        `${API}/api/doctor/courses/${selectedCourseId}/students`
      );

      if (res.data.status === "success") {
        setStudentsList(res.data.data || []);
      } else {
        setStudentsList([]);
        setErrorStudents(res.data.message || "Failed to fetch students");
      }
    } catch (err) {
      setStudentsList([]);
      setErrorStudents(err.response?.data?.message || "Error fetching students");
    } finally {
      setLoadingStudents(false);
    }
  };

  // ===== ASSIGNMENTS TAB =====
  useEffect(() => {
    if (activeTab === "assignments") {
      fetchAssignmentsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchAssignmentsData = async () => {
    try {
      setLoadingAssignments(true);
      setErrorAssignments(null);

      if (!doctorId) {
        setErrorAssignments("Doctor ID not found. Please login again.");
        return;
      }

      // Fetch all courses first
      const coursesRes = await axios.get(`${API}/api/doctor/courses/${doctorId}`);
      const coursesList = coursesRes.data.data || [];

      // Fetch assignments for all courses
      let allAssignments = [];
      for (const course of coursesList) {
        try {
          const courseId = course.id || course.entity_id;
          const res = await axios.get(
            `${API}/api/doctor/courses/${courseId}/assignments`
          );
          const assignments = res.data.data || [];
          allAssignments = allAssignments.concat(
            assignments.map((a) => ({
              ...a,
              courseName: course.code || course.title || "Untitled Course",
              courseId,
            }))
          );
        } catch (err) {
          console.error(`Error fetching assignments for course:`, err);
        }
      }

      setAssignmentsList(allAssignments);
    } catch (err) {
      setErrorAssignments(err.response?.data?.message || "Error fetching assignments");
    } finally {
      setLoadingAssignments(false);
    }
  };

  // Filtered students
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return studentsList;

    return studentsList.filter((s) => {
      const name = String(s.name || s.fullName || s.username || "").toLowerCase();
      const email = String(s.email || "").toLowerCase();
      const code = String(s.studentCode || s.code || s.entity_name || "").toLowerCase();
      return name.includes(q) || email.includes(q) || code.includes(q);
    });
  }, [studentsList, searchQuery]);

  const selectedCourse = useMemo(() => {
    return (
      coursesList.find(
        (c) => String(c.id || c.entity_id) === String(selectedCourseId)
      ) || null
    );
  }, [coursesList, selectedCourseId]);

  return (
    <div className={styles.dashboardContainer}>
      {/* Welcome Section */}
      <div className={styles.welcomeSection}>
        <div className={styles.welcomeContent}>
          <h1>
            Welcome back, <span className={styles.highlight}>{doctor?.name}</span>
          </h1>
          <p>Manage your courses, students, and assignments efficiently</p>
          {doctor && (
            <div className={styles.doctorInfo}>
              <span>{doctor.email}</span>
              {doctor.department && <span>•</span>}
              {doctor.department && <span>{doctor.department}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        <button
          className={`${styles.tabButton} ${activeTab === "overview" ? styles.active : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📊 Overview
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "courses" ? styles.active : ""}`}
          onClick={() => setActiveTab("courses")}
        >
          📚 My Courses
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "students" ? styles.active : ""}`}
          onClick={() => setActiveTab("students")}
        >
          👥 Students
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "assignments" ? styles.active : ""}`}
          onClick={() => setActiveTab("assignments")}
        >
          📝 Assignments
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className={styles.tabContent}>
          {loadingOverview ? (
            <div className={styles.loadingBox}>Loading overview...</div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>📚</div>
                  <div className={styles.statContent}>
                    <div className={styles.statLabel}>Total Courses</div>
                    <div className={styles.statValue}>{courses.length}</div>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>👥</div>
                  <div className={styles.statContent}>
                    <div className={styles.statLabel}>Total Students</div>
                    <div className={styles.statValue}>{totalStudents}</div>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>📝</div>
                  <div className={styles.statContent}>
                    <div className={styles.statLabel}>Assignments</div>
                    <div className={styles.statValue}>{totalAssignments}</div>
                  </div>
                </div>
              </div>

              {/* Courses Overview */}
              <div className={styles.section}>
                <h2>Your Courses</h2>
                {courses.length === 0 ? (
                  <div className={styles.emptyBox}>No courses assigned yet</div>
                ) : (
                  <div className={styles.coursesOverview}>
                    {courses.map((course) => {
                      const id = course.entity_id || course.id;
                      return (
                        <div
                          key={id}
                          className={styles.courseOverviewCard}
                          onClick={() => navigate(`/doctor/courses/${id}`)}
                        >
                          <div className={styles.courseOverviewHeader}>
                            <h3>{course.code || "Course"}</h3>
                            <span className={styles.courseOverviewBadge}>Active</span>
                          </div>
                          <p className={styles.courseOverviewTitle}>
                            {course.title || "Untitled"}
                          </p>
                          <div className={styles.courseOverviewMeta}>
                            <span>Credits: {course.credits || "N/A"}</span>
                          </div>
                          <button className={styles.courseOverviewAction}>
                            View Details →
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className={styles.section}>
                <h2>Quick Actions</h2>
                <div className={styles.actionGrid}>
                  <button
                    className={styles.actionButton}
                    onClick={() => setActiveTab("courses")}
                  >
                    <span className={styles.actionIcon}>📚</span>
                    <span className={styles.actionText}>View All Courses</span>
                  </button>
                  <button
                    className={styles.actionButton}
                    onClick={() => setActiveTab("students")}
                  >
                    <span className={styles.actionIcon}>👥</span>
                    <span className={styles.actionText}>Browse Students</span>
                  </button>
                  <button
                    className={styles.actionButton}
                    onClick={() => setActiveTab("assignments")}
                  >
                    <span className={styles.actionIcon}>📝</span>
                    <span className={styles.actionText}>Manage Assignments</span>
                  </button>
                  <button
                    className={styles.actionButton}
                    onClick={() => navigate("/doctor/facilities")}
                  >
                    <span className={styles.actionIcon}>🏢</span>
                    <span className={styles.actionText}>Facilities</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* COURSES TAB */}
      {activeTab === "courses" && (
        <div className={styles.tabContent}>
          {errorCourses && (
            <div className={styles.errorBox}>
              <span>{errorCourses}</span>
              <button onClick={fetchCoursesData}>Retry</button>
            </div>
          )}

          {loadingCourses ? (
            <div className={styles.loadingBox}>Loading courses...</div>
          ) : coursesList.length === 0 ? (
            <div className={styles.emptyBox}>No courses assigned yet</div>
          ) : (
            <div className={styles.coursesGrid}>
              {coursesList.map((course) => {
                const id = course.entity_id || course.id;
                return (
                  <div key={id} className={styles.courseCard}>
                    <div className={styles.courseCardHeader}>
                      <h3>{course.code || "Unnamed Course"}</h3>
                      <span className={styles.courseBadge}>Assigned</span>
                    </div>
                    <p className={styles.courseCardTitle}>
                      <strong>Title:</strong> {course.title || "N/A"}
                    </p>
                    <p className={styles.courseCardDescription}>
                      <strong>Description:</strong>{" "}
                      {course.description || "No description"}
                    </p>
                    <div className={styles.courseCardMeta}>
                      <span>Credits: {course.credits || "N/A"}</span>
                      <span>Semester: {course.semester || "N/A"}</span>
                    </div>
                    <button
                      className={styles.courseCardButton}
                      onClick={() => navigate(`/doctor/courses/${id}`)}
                    >
                      Manage Course
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STUDENTS TAB */}
      {activeTab === "students" && (
        <div className={styles.tabContent}>
          <div className={styles.studentsHeader}>
            <div className={styles.controls}>
              <div className={styles.controlGroup}>
                <label className={styles.label}>Select Course</label>
                {coursesList.length === 0 ? (
                  <div className={styles.emptyControl}>No courses available</div>
                ) : (
                  <select
                    className={styles.select}
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                  >
                    {coursesList.map((c) => {
                      const id = c.id || c.entity_id;
                      const code = c.code || c.entity_name || `COURSE-${id}`;
                      const title = c.title || "Untitled";
                      return (
                        <option key={id} value={String(id)}>
                          {code} — {title}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div className={styles.controlGroup}>
                <label className={styles.label}>Search Students</label>
                <input
                  className={styles.input}
                  placeholder="Search by name, email, or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={!selectedCourseId}
                />
              </div>
            </div>

            {selectedCourse && (
              <div className={styles.courseMeta}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Course:</span>
                  <span className={styles.metaValue}>
                    {selectedCourse.code || selectedCourse.entity_name}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Title:</span>
                  <span className={styles.metaValue}>
                    {selectedCourse.title || "N/A"}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Total Students:</span>
                  <span className={styles.metaValue}>{studentsList.length}</span>
                </div>
              </div>
            )}
          </div>

          {errorStudents && (
            <div className={styles.errorBox}>
              <span>{errorStudents}</span>
            </div>
          )}

          {loadingStudents ? (
            <div className={styles.loadingBox}>Loading students...</div>
          ) : !selectedCourseId ? (
            <div className={styles.emptyBox}>Select a course to view students</div>
          ) : filteredStudents.length === 0 ? (
            <div className={styles.emptyBox}>No students found</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Student Code</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s.id || s.entity_id || s.email}>
                      <td className={styles.cellStrong}>
                        {s.name || s.fullName || s.username || "Unknown"}
                      </td>
                      <td>{s.email || "—"}</td>
                      <td>{s.studentCode || s.code || s.entity_name || "—"}</td>
                      <td>
                        <span className={styles.statusBadge}>Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ASSIGNMENTS TAB */}
      {activeTab === "assignments" && (
        <div className={styles.tabContent}>
          {errorAssignments && (
            <div className={styles.errorBox}>
              <span>{errorAssignments}</span>
              <button onClick={fetchAssignmentsData}>Retry</button>
            </div>
          )}

          {loadingAssignments ? (
            <div className={styles.loadingBox}>Loading assignments...</div>
          ) : assignmentsList.length === 0 ? (
            <div className={styles.emptyBox}>No assignments created yet</div>
          ) : (
            <div className={styles.assignmentsGrid}>
              {assignmentsList.map((assignment) => {
                const id = assignment.assignmentId || assignment.id;
                return (
                  <div key={id} className={styles.assignmentCard}>
                    <div className={styles.assignmentCardHeader}>
                      <h3>{assignment.title || "Untitled"}</h3>
                      <span className={styles.assignmentBadge}>
                        {assignment.courseName}
                      </span>
                    </div>
                    <p className={styles.assignmentCardDescription}>
                      {assignment.description || "No description"}
                    </p>
                    <div className={styles.assignmentCardMeta}>
                      {assignment.dueDate && (
                        <span>
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {assignment.totalMarks && (
                        <span>Marks: {assignment.totalMarks}</span>
                      )}
                    </div>
                    <button
                      className={styles.assignmentCardButton}
                      onClick={() =>
                        navigate(`/doctor/courses/${assignment.courseId}`)
                      }
                    >
                      View Course
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DoctorDashboard;
