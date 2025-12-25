import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import advisorService from "../../services/advisorService";
import "./AdvisorDashboard.css";

function AdvisorDashboard() {
    const navigate = useNavigate();

    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return null;
        try {
            return JSON.parse(storedUser);
        } catch {
            return null;
        }
    });

    const [department, setDepartment] = useState(null);
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [stats, setStats] = useState({ totalStudents: 0, totalCourses: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeSection, setActiveSection] = useState("overview");
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentCourses, setStudentCourses] = useState([]);

    useEffect(() => {
        if (user?.id) {
            loadAdvisorData();
        } else {
            setLoading(false);
            setError("Please log in to view the advisor dashboard");
        }
    }, [user]);

    const loadAdvisorData = async () => {
        try {
            setLoading(true);
            setError("");

            // Check if user is an advisor and get department
            const deptRes = await advisorService.getAdvisorDepartment(user.id);

            if (deptRes.status === "success" && deptRes.data) {
                setDepartment(deptRes.data.department);

                // Load all data in parallel
                const [studentsRes, coursesRes, statsRes] = await Promise.all([
                    advisorService.getDepartmentStudents(user.id),
                    advisorService.getDepartmentCourses(user.id),
                    advisorService.getDepartmentStats(user.id)
                ]);

                if (studentsRes.status === "success") {
                    setStudents(studentsRes.data || []);
                }

                if (coursesRes.status === "success") {
                    setCourses(coursesRes.data || []);
                }

                if (statsRes.status === "success") {
                    setStats(statsRes.data || { totalStudents: 0, totalCourses: 0 });
                }
            } else {
                setError("You are not assigned as an advisor. Contact admin for assignment.");
            }
        } catch (err) {
            console.error("Error loading advisor data:", err);
            if (err.response?.status === 404) {
                setError("You are not assigned as an advisor. Contact admin for assignment.");
            } else {
                setError("Failed to connect to server");
            }
        } finally {
            setLoading(false);
        }
    };

    const viewStudentCourses = async (student) => {
        try {
            setSelectedStudent(student);
            const res = await advisorService.getStudentCourses(user.id, student.id);
            if (res.status === "success") {
                setStudentCourses(res.data || []);
            }
        } catch (err) {
            console.error("Error loading student courses:", err);
            setStudentCourses([]);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/login");
    };

    if (loading) {
        return (
            <div className="advisor-page">
                <div className="loading-container">
                    <p>Loading advisor dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="advisor-page">
            {/* Sidebar */}
            <aside className="advisor-sidebar">
                <h2 className="advisor-logo">U-Manage</h2>
                <span className="advisor-role-badge">Advisor</span>

                <nav className="advisor-menu">
                    <button
                        className={`menu-item ${activeSection === "overview" ? "active" : ""}`}
                        onClick={() => setActiveSection("overview")}
                    >
                        📊 Overview
                    </button>
                    <button
                        className={`menu-item ${activeSection === "students" ? "active" : ""}`}
                        onClick={() => { setActiveSection("students"); setSelectedStudent(null); }}
                    >
                        👥 Students
                    </button>
                    <button
                        className={`menu-item ${activeSection === "courses" ? "active" : ""}`}
                        onClick={() => setActiveSection("courses")}
                    >
                        📚 Courses
                    </button>
                </nav>

                <button className="logout-btn" onClick={handleLogout}>
                    🚪 Logout
                </button>
            </aside>

            {/* Main Content */}
            <main className="advisor-main">
                <header className="advisor-header">
                    <div>
                        <h1>Advisor Dashboard</h1>
                        <p className="subtitle">
                            {department ? `Department: ${department}` : "No department assigned"}
                        </p>
                        {error && <p className="error-text">{error}</p>}
                    </div>

                    <div className="header-right">
                        <div className="advisor-user">
                            <div className="avatar">AD</div>
                            <div>
                                <p className="user-name">{user?.username || "Advisor"}</p>
                                <p className="user-role">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Overview Section */}
                {activeSection === "overview" && (
                    <>
                        <section className="cards-grid">
                            <div className="card department-card">
                                <p className="card-label">Department</p>
                                <h2 className="card-value">{department || "Not Assigned"}</h2>
                                <p className="card-sub">Your assigned department</p>
                            </div>

                            <div className="card">
                                <p className="card-label">Total Students</p>
                                <h2 className="card-value">{stats.totalStudents}</h2>
                                <p className="card-sub">Students enrolled in dept courses</p>
                            </div>

                            <div className="card">
                                <p className="card-label">Total Courses</p>
                                <h2 className="card-value">{stats.totalCourses}</h2>
                                <p className="card-sub">Courses in department</p>
                            </div>
                        </section>

                        {department && (
                            <section className="bottom-grid">
                                <div className="panel">
                                    <h3>Recent Students</h3>
                                    <ul className="preview-list">
                                        {students.slice(0, 5).map(s => (
                                            <li key={s.id} className="preview-item">
                                                <span className="student-avatar">{s.name?.[0] || "S"}</span>
                                                <div>
                                                    <p className="student-name">{s.name || s.username}</p>
                                                    <p className="student-email">{s.email}</p>
                                                </div>
                                            </li>
                                        ))}
                                        {students.length === 0 && (
                                            <li className="preview-item empty">No students enrolled</li>
                                        )}
                                    </ul>
                                </div>

                                <div className="panel">
                                    <h3>Department Courses</h3>
                                    <ul className="preview-list">
                                        {courses.slice(0, 5).map(c => (
                                            <li key={c.id} className="preview-item">
                                                <span className="course-badge">{c.code}</span>
                                                <p>{c.title || c.name}</p>
                                            </li>
                                        ))}
                                        {courses.length === 0 && (
                                            <li className="preview-item empty">No courses available</li>
                                        )}
                                    </ul>
                                </div>
                            </section>
                        )}
                    </>
                )}

                {/* Students Section */}
                {activeSection === "students" && (
                    <section className="content-section">
                        <div className="section-header">
                            <h2>Students in {department}</h2>
                            <span className="count-badge">{students.length} students</span>
                        </div>

                        {selectedStudent ? (
                            <div className="student-detail">
                                <button className="back-btn" onClick={() => setSelectedStudent(null)}>
                                    ← Back to list
                                </button>

                                <div className="student-info-card">
                                    <div className="student-header">
                                        <div className="avatar large">{selectedStudent.name?.[0] || "S"}</div>
                                        <div>
                                            <h3>{selectedStudent.name || selectedStudent.username}</h3>
                                            <p>{selectedStudent.email}</p>
                                        </div>
                                    </div>

                                    <h4>Enrolled Courses in {department}</h4>
                                    <table className="courses-table">
                                        <thead>
                                            <tr>
                                                <th>Code</th>
                                                <th>Course</th>
                                                <th>Credits</th>
                                                <th>Status</th>
                                                <th>Grade</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {studentCourses.map(c => (
                                                <tr key={c.courseId}>
                                                    <td>{c.code}</td>
                                                    <td>{c.title}</td>
                                                    <td>{c.credits || "-"}</td>
                                                    <td>
                                                        <span className={`status-badge ${c.enrollmentStatus}`}>
                                                            {c.enrollmentStatus || "enrolled"}
                                                        </span>
                                                    </td>
                                                    <td>{c.grade || "-"}</td>
                                                </tr>
                                            ))}
                                            {studentCourses.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="empty-row">No courses found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="students-list">
                                <table className="students-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Username</th>
                                            <th>Email</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map(s => (
                                            <tr key={s.id}>
                                                <td>
                                                    <div className="student-cell">
                                                        <span className="avatar small">{s.name?.[0] || "S"}</span>
                                                        {s.name || "N/A"}
                                                    </div>
                                                </td>
                                                <td>{s.username || "N/A"}</td>
                                                <td>{s.email}</td>
                                                <td>
                                                    <button className="view-btn" onClick={() => viewStudentCourses(s)}>
                                                        View Courses
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {students.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="empty-row">
                                                    No students enrolled in department courses
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}

                {/* Courses Section */}
                {activeSection === "courses" && (
                    <section className="content-section">
                        <div className="section-header">
                            <h2>Courses in {department}</h2>
                            <span className="count-badge">{courses.length} courses</span>
                        </div>

                        <div className="courses-grid">
                            {courses.map(c => (
                                <div key={c.id} className="course-card">
                                    <div className="course-header">
                                        <span className="course-code">{c.code}</span>
                                        <span className="credits-badge">{c.credits || 3} credits</span>
                                    </div>
                                    <h3 className="course-title">{c.title || c.name}</h3>
                                    <p className="course-desc">{c.description || "No description available"}</p>
                                </div>
                            ))}
                            {courses.length === 0 && (
                                <p className="empty-message">No courses found in this department</p>
                            )}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}

export default AdvisorDashboard;
