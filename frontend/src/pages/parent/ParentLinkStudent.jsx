import { useState } from "react";
import { Link } from "react-router-dom";
import parentService from "../../services/parentService";
import "./ParentPages.css";

function ParentLinkStudent() {
    const [studentEmail, setStudentEmail] = useState("");
    const [relationship, setRelationship] = useState("Parent");
    const [status, setStatus] = useState("");
    const [statusType, setStatusType] = useState(""); // success, error
    const [loading, setLoading] = useState(false);

    const relationshipOptions = ["Parent", "Mother", "Father", "Guardian", "Other"];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!studentEmail.trim()) {
            setStatus("Please enter the student's email address");
            setStatusType("error");
            return;
        }

        setLoading(true);
        setStatus("");

        try {
            const result = await parentService.requestStudentLink(studentEmail, relationship);
            setStatus(result.message || "Link request submitted successfully! Waiting for admin approval.");
            setStatusType("success");
            setStudentEmail("");
        } catch (error) {
            setStatus(error.response?.data?.message || "Failed to submit request. Please try again.");
            setStatusType("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="parent-page">
            <div className="parent-header">
                <Link to="/parent/dashboard" className="back-link">
                    ← Back to Dashboard
                </Link>
                <h1>Link Your Student</h1>
                <p>Submit a request to link your student's account to your parent portal</p>
            </div>

            <div className="parent-content">
                <div className="link-student-card">
                    <div className="card-icon">👨‍👩‍👧</div>
                    <h2>Request Student Link</h2>
                    <p className="card-description">
                        Enter your student's email address below. An administrator will review
                        and approve your request. Once approved, you'll be able to view your
                        student's grades, attendance, and communicate with their teachers.
                    </p>

                    <form onSubmit={handleSubmit} className="link-form">
                        <div className="form-group">
                            <label htmlFor="studentEmail">Student Email Address</label>
                            <input
                                type="email"
                                id="studentEmail"
                                value={studentEmail}
                                onChange={(e) => setStudentEmail(e.target.value)}
                                placeholder="student@ums-student.edu"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="relationship">Your Relationship</label>
                            <select
                                id="relationship"
                                value={relationship}
                                onChange={(e) => setRelationship(e.target.value)}
                                disabled={loading}
                            >
                                {relationshipOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>

                        {status && (
                            <div className={`status-message ${statusType}`}>
                                {statusType === "success" ? "✅" : "⚠️"} {status}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={loading}
                        >
                            {loading ? "Submitting..." : "Submit Link Request"}
                        </button>
                    </form>

                    <div className="info-box">
                        <h3>📋 What happens next?</h3>
                        <ul>
                            <li>Your request will be sent to the administration</li>
                            <li>An admin will verify your relationship to the student</li>
                            <li>Once approved, the student will appear in your dashboard</li>
                            <li>You'll gain access to grades, attendance, and messaging</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ParentLinkStudent;
