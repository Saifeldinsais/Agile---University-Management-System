import { useState, useEffect } from "react";
import styles from "./StudentPages.module.css";
import { API_BASE_URL } from "../../services/config";
import assignmentSubmissionService from "../../services/assignmentSubmissionService";

function Assessments() {
  const [activeTab, setActiveTab] = useState("overview");
  const [assessments, setAssessments] = useState([]); // Renamed from assignments
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [student] = useState(() => {
    const storedUser = localStorage.getItem("user") || localStorage.getItem("student");
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser);
    } catch (err) {
      console.error("Failed to parse stored user:", err);
      return null;
    }
  });

  useEffect(() => {
    document.title = 'Assessments & Grades - Performance Tracking';
  }, []);

  useEffect(() => {
    if (activeTab === "assessments") { // Changed tab name
      loadAssessments();
    }
  }, [activeTab]);

  const loadAssessments = async () => {
    if (!student?.id) {
      setError("No student session found.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Get enrolled & approved courses
      const enrollRes = await fetch(`${API_BASE_URL}/student/enrolled/${student.id}`);
      const enrollData = await enrollRes.json();
      const enrolled = enrollData.courses || [];

      const approved = enrolled.filter(
        (c) => c.status?.toLowerCase() === "approved"
      );

      if (approved.length === 0) {
        setAssessments([]);
        setLoading(false);
        return;
      }

      // Step 2: Fetch assessments from all approved courses
      const responses = await Promise.all(
        approved.map((c) =>
          fetch(`${API_BASE_URL}/student/courses/${c.courseId}/assignments`)
            .then((r) => r.json())
            .catch(() => ({ assignments: [], data: [] }))
        )
      );

      // Step 3: Flatten and normalize
      const allRawAssessments = responses.flatMap((r) => r.assignments || r.data || []);

      const normalizedAssessments = allRawAssessments.map((a) => ({
        ...a,
        id: a.assignmentId || a._id || a.quizId,
        title: a.title || a.name || "Untitled Assessment",
        type: (a.type || "assignment").toLowerCase(), // "assignment" or "quiz"
        dueDate: a.dueDate || a.deadline || a.startDate,
        course_name: a.course_name || a.courseName,
        description: a.description || a.instructions || "No description available",
        totalMarks: a.totalMarks || a.marks || a.points,
        status: a.status || a.submission_status, // submitted, graded, etc.
        grade: a.grade || a.obtainedMarks,
      }));

      // Optional: Sort by due date
      normalizedAssessments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

      setAssessments(normalizedAssessments);
    } catch (err) {
      console.error("Error loading assessments:", err);
      setError("Failed to load assessments. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClick = (assessment) => {
    if (assessment.type === "quiz") {
      alert("Quiz taking feature coming soon!");
      // Later: navigate to /quiz/:id or open quiz modal
      return;
    }
    setSelectedAssessment(assessment);
    setShowSubmitModal(true);
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFile(files[0]);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!uploadedFile) {
      alert("Please select a file to upload");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('files', uploadedFile);

      await assignmentSubmissionService.submitAssignment(
        selectedAssessment.id,
        formData
      );

      alert("Assignment submitted successfully!");
      setShowSubmitModal(false);
      setUploadedFile(null);
      loadAssessments();
    } catch (err) {
      alert("Failed to submit: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeBadge = (type) => {
    if (type === "quiz") {
      return { text: "Quiz", color: "#a78bfa", bg: "#f3e8ff" };
    }
    return { text: "Assignment", color: "#1e40af", bg: "#dbeafe" };
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>📊 Assessments & Grades</h1>
        <p>View your assignments, quizzes, exams, and received grades with feedback</p>
      </div>

      <div className={styles.pageContent}>
        {activeTab === "overview" && (
          <>
            <div className={styles.section}>
              <h2>Assessments & Performance</h2>
              <p style={{ color: '#6b7280' }}>
                Track all course assessments including assignments, quizzes, and exams.
              </p>

              <div className={styles.featureList}>
                <div
                  className={styles.feature}
                  onClick={() => setActiveTab("assessments")}
                  style={{ cursor: 'pointer' }}
                >
                  <h3>📝 Assignments & Quizzes</h3>
                  <p>View deadlines, submit work, and take quizzes</p>
                </div>
                <div className={styles.feature}>
                  <h3>✅ Exams</h3>
                  <p>Track exam schedules (coming soon)</p>
                </div>
                <div className={styles.feature}>
                  <h3>⭐ Grades</h3>
                  <p>View released grades and feedback</p>
                </div>
              </div>
            </div>

            {/* Other sections unchanged */}
            <div className={styles.section}>
              <h2>Privacy & Access</h2>
              <p style={{ color: '#6b7280' }}>
                All assessments, grades, and feedback are strictly private and visible only to you.
              </p>
            </div>

            <div className={styles.section}>
              <h2>Features Coming Soon</h2>
              <ul style={{ color: '#6b7280', lineHeight: '1.8' }}>
                <li>✓ View assignments and quizzes</li>
                <li>✓ Submit assignments</li>
                <li>✓ Take online quizzes</li>
                <li>✓ View grades and feedback</li>
                <li>✓ Performance analytics</li>
              </ul>
            </div>
          </>
        )}

        {activeTab === "assessments" && (
          <div className={styles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>📚 My Assessments</h2>
              <button
                onClick={() => setActiveTab("overview")}
                style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}
              >
                ← Back
              </button>
            </div>

            {loading && <p style={{ color: '#6b7280' }}>Loading assessments...</p>}
            {error && <p style={{ color: '#ef4444' }}>⚠️ {error}</p>}

            {!loading && !error && assessments.length === 0 && (
              <p style={{ color: '#6b7280' }}>No assignments or quizzes available at this time.</p>
            )}

            {!loading && !error && assessments.length > 0 && (
              <div style={{ display: 'grid', gap: '16px' }}>
                {assessments.map((item) => {
                  const badge = getTypeBadge(item.type);
                  const isSubmitted = item.status === 'submitted' || item.submission_status === 'submitted';
                  const hasGrade = item.grade !== undefined && item.grade !== null;

                  return (
                    <div
                      key={item.id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '16px',
                        backgroundColor: '#f9fafb',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <h3 style={{ margin: 0, color: '#1f2937' }}>
                              {item.title}
                            </h3>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '0.8em',
                              fontWeight: '600',
                              backgroundColor: badge.bg,
                              color: badge.color
                            }}>
                              {badge.text}
                            </span>
                          </div>

                          {item.course_name && (
                            <p style={{ color: '#6b7280', fontSize: '0.9em', margin: '4px 0' }}>
                              <strong>Course:</strong> {item.course_name}
                            </p>
                          )}

                          <p style={{ color: '#6b7280', margin: '8px 0', lineHeight: '1.6' }}>
                            {item.description}
                          </p>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginTop: '12px' }}>
                            <p style={{ color: '#6b7280', fontSize: '0.9em', margin: 0 }}>
                              <strong>Due:</strong> {item.dueDate ? new Date(item.dueDate).toLocaleString() : 'No deadline'}
                            </p>
                            {item.totalMarks && (
                              <p style={{ color: '#6b7280', fontSize: '0.9em', margin: 0 }}>
                                <strong>Worth:</strong> {item.totalMarks} marks
                              </p>
                            )}
                            {hasGrade && (
                              <p style={{ color: '#059669', fontSize: '0.9em', margin: 0, fontWeight: '600' }}>
                                <strong>Grade:</strong> {item.grade} / {item.totalMarks}
                              </p>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                          {item.type === "assignment" && (
                            <span style={{
                              padding: '6px 12px',
                              borderRadius: '4px',
                              fontSize: '0.85em',
                              fontWeight: '500',
                              backgroundColor: isSubmitted ? '#d1fae5' : '#fef3c7',
                              color: isSubmitted ? '#065f46' : '#78350f'
                            }}>
                              {isSubmitted ? '✓ Submitted' : '⏳ Not Submitted'}
                            </span>
                          )}

                          {item.type === "quiz" && (
                            <span style={{
                              padding: '6px 12px',
                              borderRadius: '4px',
                              fontSize: '0.85em',
                              fontWeight: '500',
                              backgroundColor: '#e0e7ff',
                              color: '#4338ca'
                            }}>
                              👆 Click to Start
                            </span>
                          )}

                          <button
                            onClick={() => handleSubmitClick(item)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            {item.type === "quiz" ? "Take Quiz" : isSubmitted ? "View Submission" : "Submit"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit Modal - Only for Assignments */}
      {showSubmitModal && selectedAssessment && selectedAssessment.type === "assignment" && (
        // ... (same modal code as before)
        <div style={{ /* modal overlay */ }}>
          <div style={{ /* modal content */ }}>
            <h2>Submit Assignment</h2>
            <p>{selectedAssessment.title}</p>
            {/* File upload input */}
            <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.jpg,.png" />
            {uploadedFile && <p>✓ Selected: {uploadedFile.name}</p>}
            <div>
              <button onClick={() => { setShowSubmitModal(false); setUploadedFile(null); }}>Cancel</button>
              <button onClick={handleSubmitAssignment} disabled={submitting || !uploadedFile}>
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Assessments;