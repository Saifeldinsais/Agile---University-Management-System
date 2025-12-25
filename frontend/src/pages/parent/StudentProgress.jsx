import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import parentService from "../../services/parentService";
import "./ParentPages.css";

function StudentProgress() {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("grades");
    const [progress, setProgress] = useState(null);
    const [attendance, setAttendance] = useState(null);
    const [remarks, setRemarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadProgress();
    }, [studentId]);

    const loadProgress = async () => {
        try {
            setLoading(true);
            const [progressRes, attendanceRes, remarksRes] = await Promise.all([
                parentService.getStudentProgress(studentId),
                parentService.getStudentAttendance(studentId),
                parentService.getStudentRemarks(studentId),
            ]);
            setProgress(progressRes.data);
            setAttendance(attendanceRes.data);
            setRemarks(remarksRes.data);
        } catch (err) {
            setError(err.message || "Failed to load progress");
        } finally {
            setLoading(false);
        }
    };

    const getGradeClass = (grade) => {
        if (grade >= 90) return "excellent";
        if (grade >= 75) return "good";
        if (grade >= 60) return "average";
        return "poor";
    };

    if (loading) {
        return (
            <div className="parent-page loading">
                <div className="spinner"></div>
                <p>Loading progress...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="parent-page error">
                <div className="error-card">
                    <span className="error-icon">⚠️</span>
                    <p>{error}</p>
                    <button onClick={() => navigate("/parent/students")}>
                        Back to Students
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="parent-page progress-page">
            <div className="page-header">
                <button className="back-btn" onClick={() => navigate("/parent/students")}>
                    ← Back
                </button>
                <h2 className="page-title">Student Progress</h2>
            </div>

            {/* Tabs */}
            <div className="progress-tabs">
                <button
                    className={`progress-tab ${activeTab === "grades" ? "active" : ""}`}
                    onClick={() => setActiveTab("grades")}
                >
                    📊 Grades
                </button>
                <button
                    className={`progress-tab ${activeTab === "attendance" ? "active" : ""}`}
                    onClick={() => setActiveTab("attendance")}
                >
                    📅 Attendance
                </button>
                <button
                    className={`progress-tab ${activeTab === "remarks" ? "active" : ""}`}
                    onClick={() => setActiveTab("remarks")}
                >
                    📝 Remarks
                </button>
            </div>

            {/* Grades Tab */}
            {activeTab === "grades" && (
                <div className="tab-content">
                    {/* GPA Card */}
                    <div className="gpa-card">
                        <div className="gpa-value">{progress?.gpa || "N/A"}</div>
                        <div className="gpa-label">Current GPA</div>
                    </div>

                    {/* Course Stats */}
                    <div className="stats-grid small">
                        <div className="stat-card">
                            <div className="stat-value">{progress?.totalCourses || 0}</div>
                            <div className="stat-label">Total Courses</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{progress?.completedCourses || 0}</div>
                            <div className="stat-label">Completed</div>
                        </div>
                    </div>

                    {/* Courses Table */}
                    <div className="dashboard-section">
                        <h3>Enrolled Courses</h3>
                        {progress?.enrollments?.length > 0 ? (
                            <table className="courses-table">
                                <thead>
                                    <tr>
                                        <th>Course</th>
                                        <th>Status</th>
                                        <th>Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {progress.enrollments.map((enrollment) => (
                                        <tr key={enrollment.enrollment_id}>
                                            <td>{enrollment.course_name}</td>
                                            <td>
                                                <span className={`status-badge ${enrollment.status}`}>
                                                    {enrollment.status}
                                                </span>
                                            </td>
                                            <td>
                                                {enrollment.grade !== null ? (
                                                    <span className={`grade-badge ${getGradeClass(enrollment.grade)}`}>
                                                        {enrollment.grade}%
                                                    </span>
                                                ) : (
                                                    <span className="no-grade">--</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-state">
                                <p>No courses found</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Attendance Tab */}
            {activeTab === "attendance" && (
                <div className="tab-content">
                    {/* Attendance Stats */}
                    <div className="stats-grid small">
                        <div className="stat-card">
                            <div className="stat-value">{attendance?.stats?.attendanceRate || "N/A"}</div>
                            <div className="stat-label">Attendance Rate</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{attendance?.stats?.present || 0}</div>
                            <div className="stat-label">Present</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{attendance?.stats?.absent || 0}</div>
                            <div className="stat-label">Absent</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{attendance?.stats?.late || 0}</div>
                            <div className="stat-label">Late</div>
                        </div>
                    </div>

                    {/* Attendance Records */}
                    <div className="dashboard-section">
                        <h3>Recent Records</h3>
                        {attendance?.attendance?.length > 0 ? (
                            <div className="attendance-list">
                                {attendance.attendance.map((record) => (
                                    <div key={record.attendance_id} className={`attendance-item ${record.status}`}>
                                        <div className="attendance-date">
                                            {new Date(record.attendance_date).toLocaleDateString()}
                                        </div>
                                        <div className="attendance-course">{record.course_name}</div>
                                        <div className={`attendance-status ${record.status}`}>
                                            {record.status}
                                        </div>
                                        {record.remarks && (
                                            <div className="attendance-remarks">{record.remarks}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>No attendance records found</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Remarks Tab */}
            {activeTab === "remarks" && (
                <div className="tab-content">
                    <div className="dashboard-section">
                        <h3>Teacher Remarks</h3>
                        {remarks?.length > 0 ? (
                            <div className="remarks-list">
                                {remarks.map((remark) => (
                                    <div key={remark.remark_id} className={`remark-card ${remark.remark_type}`}>
                                        <div className="remark-header">
                                            <span className={`remark-type ${remark.remark_type}`}>
                                                {remark.remark_type}
                                            </span>
                                            <span className="remark-date">
                                                {new Date(remark.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="remark-meta">
                                            <span>👤 {remark.teacher_name}</span>
                                            <span>📚 {remark.course_name}</span>
                                        </div>
                                        <p className="remark-text">{remark.remark_text}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <span className="empty-icon">📝</span>
                                <p>No remarks from teachers yet</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default StudentProgress;
