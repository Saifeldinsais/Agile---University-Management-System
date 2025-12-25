import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import parentService from "../../services/parentService";
import "./ParentPages.css";

function MyStudents() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            setLoading(true);
            const response = await parentService.getStudents();
            setStudents(response.data);
        } catch (err) {
            setError(err.message || "Failed to load students");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="parent-page loading">
                <div className="spinner"></div>
                <p>Loading students...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="parent-page error">
                <div className="error-card">
                    <span className="error-icon">⚠️</span>
                    <p>{error}</p>
                    <button onClick={loadStudents}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="parent-page students-page">
            <h2 className="page-title">My Students</h2>

            {students.length > 0 ? (
                <div className="students-grid">
                    {students.map((student) => (
                        <div key={student.student_id} className="student-card-detailed">
                            <div className="student-avatar large">
                                {student.student_name?.charAt(0) || "S"}
                            </div>
                            <div className="student-details">
                                <h3>{student.student_name}</h3>
                                <div className="student-meta">
                                    <span className="meta-item">
                                        <span className="meta-icon">📧</span>
                                        {student.email || "No email"}
                                    </span>
                                    <span className="meta-item">
                                        <span className="meta-icon">👤</span>
                                        {student.relationship || "Parent"}
                                    </span>
                                </div>
                            </div>
                            <div className="student-actions">
                                <Link
                                    to={`/parent/students/${student.student_id}/progress`}
                                    className="action-btn primary"
                                >
                                    📊 View Progress
                                </Link>
                                <Link
                                    to={`/parent/messages?student=${student.student_id}`}
                                    className="action-btn secondary"
                                >
                                    💬 Contact Teachers
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state large">
                    <span className="empty-icon">👨‍👩‍👧‍👦</span>
                    <h3>No Students Linked</h3>
                    <p>
                        You don't have any students linked to your account yet.
                        <br />
                        Please contact the school administration to link your children.
                    </p>
                </div>
            )}
        </div>
    );
}

export default MyStudents;
