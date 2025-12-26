import { useState, useEffect, useMemo } from "react";
import styles from "./StudentPages.module.css";
import { API_BASE_URL } from "../../services/config";
import assignmentSubmissionService from "../../services/assignmentSubmissionService";

// GPA to Letter Grade conversion (standard 4.0 scale)
const gpaToLetter = (gpa) => {
  if (gpa >= 4.0) return { letter: "A", color: "#22c55e" };
  if (gpa >= 3.7) return { letter: "A-", color: "#22c55e" };
  if (gpa >= 3.3) return { letter: "B+", color: "#3b82f6" };
  if (gpa >= 3.0) return { letter: "B", color: "#3b82f6" };
  if (gpa >= 2.7) return { letter: "B-", color: "#3b82f6" };
  if (gpa >= 2.3) return { letter: "C+", color: "#f59e0b" };
  if (gpa >= 2.0) return { letter: "C", color: "#f59e0b" };
  if (gpa >= 1.7) return { letter: "C-", color: "#f59e0b" };
  if (gpa >= 1.3) return { letter: "D+", color: "#ef4444" };
  if (gpa >= 1.0) return { letter: "D", color: "#ef4444" };
  if (gpa >= 0.7) return { letter: "D-", color: "#ef4444" };
  return { letter: "F", color: "#6b7280" };
};

function Assessments() {
  const [activeTab, setActiveTab] = useState("overview");

  // Auth
  const token = useMemo(() => localStorage.getItem("token"), []);
  const authHeaders = useMemo(() => {
    const h = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  // Student info
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

  // Assessments state
  const [courseAssessments, setCourseAssessments] = useState([]);
  const [assessmentSummary, setAssessmentSummary] = useState({
    totalCourses: 0,
    totalAssessments: 0,
    submittedCount: 0,
    gradedCount: 0,
    pendingCount: 0
  });
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [expandedCourses, setExpandedCourses] = useState({});

  // Submission modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Grades state
  const [gradesData, setGradesData] = useState({
    completedCourses: [],
    gpa: 0,
    totalCredits: 0
  });
  const [gradesLoading, setGradesLoading] = useState(false);

  useEffect(() => {
    document.title = 'Assessments & Grades - Performance Tracking';
  }, []);

  useEffect(() => {
    if (activeTab === "assessments") {
      loadAssessments();
    } else if (activeTab === "grades") {
      loadGrades();
    }
  }, [activeTab]);

  const loadAssessments = async () => {
    if (!token) {
      alert("Please log in to view assessments.");
      return;
    }

    setLoadingAssessments(true);
    try {
      const res = await fetch(`${API_BASE_URL}/student/my-assessments`, {
        method: "GET",
        headers: authHeaders,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Failed to fetch assessments");

      setCourseAssessments(Array.isArray(json.data) ? json.data : []);
      setAssessmentSummary(json.summary || {
        totalCourses: 0,
        totalAssessments: 0,
        submittedCount: 0,
        gradedCount: 0,
        pendingCount: 0
      });

      // Auto-expand all courses with assessments
      const expanded = {};
      (json.data || []).forEach(c => {
        if (c.assessmentCount > 0) {
          expanded[c.courseId] = true;
        }
      });
      setExpandedCourses(expanded);
    } catch (err) {
      console.error("loadAssessments error:", err);
      setCourseAssessments([]);
    } finally {
      setLoadingAssessments(false);
    }
  };

  const loadGrades = async () => {
    if (!student?.id) return;

    setGradesLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/student/completed-courses/${student.id}`);
      if (!res.ok) throw new Error("Failed to fetch grades");
      const data = await res.json();
      setGradesData({
        completedCourses: data.completedCourses || [],
        gpa: data.gpa || 0,
        totalCredits: data.totalCredits || 0
      });
    } catch (err) {
      console.error("Error loading grades:", err);
    } finally {
      setGradesLoading(false);
    }
  };

  const toggleCourseExpand = (courseId) => {
    setExpandedCourses((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

  const getTypeBadge = (type) => {
    if (type === "quiz") {
      return { text: "Quiz", color: "#a78bfa", bg: "#f3e8ff", icon: "📝" };
    }
    if (type === "exam") {
      return { text: "Exam", color: "#ef4444", bg: "#fee2e2", icon: "📋" };
    }
    return { text: "Assignment", color: "#1e40af", bg: "#dbeafe", icon: "📄" };
  };

  const getStatusBadge = (assessment) => {
    if (assessment.isGraded) {
      return { text: "Graded", color: "#059669", bg: "#d1fae5", icon: "✓" };
    }
    if (assessment.isSubmitted) {
      return { text: "Submitted - Awaiting Grade", color: "#0369a1", bg: "#dbeafe", icon: "📤" };
    }
    return { text: "Not Submitted", color: "#d97706", bg: "#fef3c7", icon: "⏳" };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "No deadline";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  const isOverdue = (dateStr, isSubmitted) => {
    if (!dateStr || isSubmitted) return false;
    try {
      return new Date(dateStr) < new Date();
    } catch {
      return false;
    }
  };

  // Submission handlers
  const handleSubmitClick = (assessment, course) => {
    setSelectedAssessment(assessment);
    setSelectedCourse(course);
    setUploadedFile(null);
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

    if (!selectedAssessment) {
      alert("No assessment selected");
      return;
    }

    setSubmitting(true);
    try {
      await assignmentSubmissionService.submitAssignment(
        selectedAssessment.assessmentId,
        [uploadedFile]
      );

      alert("✅ Assignment submitted successfully! Waiting for grade from instructor.");
      setShowSubmitModal(false);
      setUploadedFile(null);
      setSelectedAssessment(null);

      // Reload assessments to update status
      await loadAssessments();
    } catch (err) {
      console.error("Submit error:", err);
      alert("Failed to submit: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>📊 Assessments & Grades</h1>
        <p>View assignments from your courses, submit your work, and check grades</p>
      </div>

      <div className={styles.pageContent}>
        {activeTab === "overview" && (
          <>
            <div className={styles.section}>
              <h2>Assessments & Performance</h2>
              <p style={{ color: '#6b7280' }}>
                View all assessments from your enrolled courses. Submit your work and wait for grades from your instructors.
              </p>

              <div className={styles.featureList}>
                <button
                  type="button"
                  className={styles.feature}
                  onClick={() => setActiveTab("assessments")}
                  style={{
                    cursor: 'pointer',
                    textAlign: 'left',
                    background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                    border: '2px solid #667eea',
                    width: '100%'
                  }}
                >
                  <h3>📝 My Assessments</h3>
                  <p>View assignments & quizzes, submit work, check grades</p>
                  <span style={{ fontSize: '0.8rem', color: '#667eea', fontWeight: 600 }}>
                    Click to view by course →
                  </span>
                </button>

                <button
                  type="button"
                  className={styles.feature}
                  onClick={() => setActiveTab("grades")}
                  style={{
                    cursor: 'pointer',
                    textAlign: 'left',
                    background: 'linear-gradient(135deg, #22c55e15 0%, #16a34a15 100%)',
                    border: '2px solid #22c55e',
                    width: '100%'
                  }}
                >
                  <h3>⭐ Final Course Grades</h3>
                  <p>View completed course grades and GPA</p>
                  <span style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: 600 }}>
                    View transcript →
                  </span>
                </button>
              </div>
            </div>

            <div className={styles.section}>
              <h2>How It Works</h2>
              <div style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
                  <div style={{ fontSize: '2rem', background: '#667eea', color: 'white', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</div>
                  <div>
                    <h4 style={{ margin: '0 0 4px' }}>Doctor Creates Assessment</h4>
                    <p style={{ margin: 0, color: '#6b7280' }}>Your instructor creates assignments, quizzes, or exams for your course</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
                  <div style={{ fontSize: '2rem', background: '#0ea5e9', color: 'white', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</div>
                  <div>
                    <h4 style={{ margin: '0 0 4px' }}>You Submit Your Work</h4>
                    <p style={{ margin: 0, color: '#6b7280' }}>Upload your assignment file before the deadline</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
                  <div style={{ fontSize: '2rem', background: '#22c55e', color: 'white', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</div>
                  <div>
                    <h4 style={{ margin: '0 0 4px' }}>Receive Your Grade</h4>
                    <p style={{ margin: 0, color: '#6b7280' }}>Doctor grades your work and you see the grade here</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "assessments" && (
          <div className={styles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ margin: 0 }}>📝 Assessments by Course</h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={loadAssessments}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  🔄 Refresh
                </button>
                <button
                  onClick={() => setActiveTab("overview")}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  ← Back
                </button>
              </div>
            </div>

            {loadingAssessments ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
                <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Loading assessments from your courses...</p>
              </div>
            ) : courseAssessments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '2px dashed #e5e7eb' }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📚</div>
                <h3 style={{ color: '#374151', marginBottom: '8px' }}>No Assessments Found</h3>
                <p style={{ color: '#6b7280' }}>
                  Your instructors haven't added any assessments yet, or you're not enrolled in any approved courses.
                </p>
              </div>
            ) : (
              <>
                {/* Summary Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: '20px', color: 'white', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{assessmentSummary.totalAssessments}</div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Total Assessments</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderRadius: '12px', padding: '20px', color: 'white', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{assessmentSummary.pendingCount}</div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>To Submit</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)', borderRadius: '12px', padding: '20px', color: 'white', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{assessmentSummary.submittedCount}</div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Awaiting Grade</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', borderRadius: '12px', padding: '20px', color: 'white', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{assessmentSummary.gradedCount}</div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Graded</div>
                  </div>
                </div>

                {/* Course Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {courseAssessments.map((course) => (
                    <div
                      key={course.courseId}
                      style={{
                        border: '2px solid #e5e7eb',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                      }}
                    >
                      {/* Course Header */}
                      <button
                        onClick={() => toggleCourseExpand(course.courseId)}
                        style={{
                          width: '100%',
                          padding: '20px 24px',
                          background: expandedCourses[course.courseId]
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          textAlign: 'left',
                          color: expandedCourses[course.courseId] ? 'white' : '#1f2937'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>
                            {course.code && <span style={{ opacity: 0.9 }}>{course.code} — </span>}
                            {course.title}
                          </div>
                          <div style={{ opacity: 0.8, fontSize: '0.95rem', marginTop: '6px' }}>
                            {course.department && `${course.department} • `}
                            <span style={{ fontWeight: 600 }}>{course.assessmentCount}</span> {course.assessmentCount === 1 ? 'assessment' : 'assessments'}
                          </div>
                        </div>
                        <div style={{
                          background: expandedCourses[course.courseId] ? 'rgba(255,255,255,0.2)' : '#667eea',
                          color: 'white',
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          transition: 'transform 0.3s ease',
                          transform: expandedCourses[course.courseId] ? 'rotate(180deg)' : 'rotate(0deg)'
                        }}>
                          ▼
                        </div>
                      </button>

                      {/* Course Assessments */}
                      {expandedCourses[course.courseId] && (
                        <div style={{ padding: '20px 24px', background: 'white' }}>
                          {course.assessments.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📭</div>
                              <p style={{ margin: 0 }}>No assessments added by the instructor yet.</p>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              {course.assessments.map((assessment) => {
                                const typeBadge = getTypeBadge(assessment.type);
                                const statusBadge = getStatusBadge(assessment);
                                const overdue = isOverdue(assessment.dueDate, assessment.isSubmitted);

                                return (
                                  <div
                                    key={assessment.assessmentId}
                                    style={{
                                      padding: '20px',
                                      background: assessment.isGraded ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : '#fafafa',
                                      borderRadius: '12px',
                                      border: assessment.isGraded ? '2px solid #86efac' : '1px solid #e5e7eb'
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                                      {/* Left Side - Assessment Info */}
                                      <div style={{ flex: 1, minWidth: '250px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                          <span style={{ fontSize: '1.5rem' }}>{typeBadge.icon}</span>
                                          <h3 style={{ margin: 0, color: '#1f2937', fontWeight: 700, fontSize: '1.1rem' }}>
                                            {assessment.title}
                                          </h3>
                                          <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            backgroundColor: typeBadge.bg,
                                            color: typeBadge.color
                                          }}>
                                            {typeBadge.text}
                                          </span>
                                        </div>

                                        {assessment.description && (
                                          <p style={{ color: '#6b7280', margin: '0 0 12px', fontSize: '0.95rem', lineHeight: 1.6 }}>
                                            {assessment.description}
                                          </p>
                                        )}

                                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.9rem' }}>
                                          <span style={{ color: overdue ? '#ef4444' : '#6b7280', fontWeight: overdue ? 600 : 400 }}>
                                            📅 Due: {formatDate(assessment.dueDate)}
                                            {overdue && <span style={{ marginLeft: '8px', color: '#ef4444' }}>⚠️ OVERDUE</span>}
                                          </span>
                                          {assessment.totalMarks && (
                                            <span style={{ color: '#6b7280' }}>💯 {assessment.totalMarks} marks</span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Right Side - Status & Actions */}
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', minWidth: '180px' }}>
                                        {/* Status Badge */}
                                        <span style={{
                                          padding: '8px 16px',
                                          borderRadius: '20px',
                                          fontSize: '0.9rem',
                                          fontWeight: 600,
                                          backgroundColor: statusBadge.bg,
                                          color: statusBadge.color,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '8px'
                                        }}>
                                          {statusBadge.icon} {statusBadge.text}
                                        </span>

                                        {/* Grade Display (if graded) */}
                                        {assessment.isGraded && (
                                          <div style={{
                                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                            color: 'white',
                                            padding: '14px 24px',
                                            borderRadius: '14px',
                                            textAlign: 'center',
                                            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
                                          }}>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: '4px' }}>YOUR GRADE</div>
                                            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
                                              {assessment.grade}
                                              {assessment.totalMarks && (
                                                <span style={{ fontSize: '1rem', fontWeight: 400, opacity: 0.9 }}> / {assessment.totalMarks}</span>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        {/* Submit Button (if not submitted) */}
                                        {!assessment.isSubmitted && !assessment.isGraded && (
                                          <button
                                            onClick={() => handleSubmitClick(assessment, course)}
                                            style={{
                                              padding: '12px 24px',
                                              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                              color: 'white',
                                              border: 'none',
                                              borderRadius: '10px',
                                              cursor: 'pointer',
                                              fontWeight: 600,
                                              fontSize: '0.95rem',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '8px',
                                              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                                            }}
                                          >
                                            📤 Submit Assignment
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Feedback Section */}
                                    {assessment.feedback && (
                                      <div style={{
                                        marginTop: '16px',
                                        padding: '16px 20px',
                                        background: 'white',
                                        borderRadius: '10px',
                                        borderLeft: '4px solid #0ea5e9'
                                      }}>
                                        <div style={{ fontWeight: 600, color: '#0369a1', marginBottom: '8px', fontSize: '0.9rem' }}>
                                          💬 Instructor Feedback:
                                        </div>
                                        <p style={{ margin: 0, color: '#334155', fontSize: '0.95rem', lineHeight: 1.7 }}>
                                          {assessment.feedback}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "grades" && (
          <div className={styles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0 }}>⭐ Academic Transcript</h2>
              <button
                onClick={() => setActiveTab("overview")}
                style={{ padding: '10px 20px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
              >
                ← Back
              </button>
            </div>

            {gradesLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
                <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Loading grades...</p>
              </div>
            ) : (
              <>
                {/* GPA Summary Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '20px',
                  marginBottom: '32px'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '16px',
                    padding: '28px',
                    color: 'white',
                    textAlign: 'center',
                    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
                  }}>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px', fontWeight: '500' }}>CUMULATIVE GPA</div>
                    <div style={{ fontSize: '3.5rem', fontWeight: '700', lineHeight: 1 }}>{gradesData.gpa.toFixed(2)}</div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '8px' }}>out of 4.00</div>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    borderRadius: '16px',
                    padding: '28px',
                    color: 'white',
                    textAlign: 'center',
                    boxShadow: '0 10px 30px rgba(34, 197, 94, 0.3)'
                  }}>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px', fontWeight: '500' }}>CREDIT HOURS</div>
                    <div style={{ fontSize: '3.5rem', fontWeight: '700', lineHeight: 1 }}>{gradesData.totalCredits}</div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '8px' }}>total earned</div>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    borderRadius: '16px',
                    padding: '28px',
                    color: 'white',
                    textAlign: 'center',
                    boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)'
                  }}>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px', fontWeight: '500' }}>COURSES</div>
                    <div style={{ fontSize: '3.5rem', fontWeight: '700', lineHeight: 1 }}>{gradesData.completedCourses.length}</div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '8px' }}>completed</div>
                  </div>
                </div>

                {/* Completed Courses */}
                {gradesData.completedCourses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '2px dashed #e5e7eb' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📚</div>
                    <h3 style={{ color: '#374151', marginBottom: '8px' }}>No Completed Courses Yet</h3>
                    <p style={{ color: '#6b7280' }}>Your completed courses and grades will appear here.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {gradesData.completedCourses.map((course, idx) => {
                      const gradeInfo = gpaToLetter(course.finalGrade);
                      const displayLetter = course.letterGrade || gradeInfo.letter;

                      return (
                        <div key={course.enrollmentId || idx} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '20px 24px',
                          background: 'white',
                          borderRadius: '12px',
                          border: '1px solid #e5e7eb',
                          gap: '20px',
                          flexWrap: 'wrap'
                        }}>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '1.05rem' }}>{course.title}</div>
                            <div style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '4px' }}>
                              {course.code && `${course.code} • `}{course.credits} Credits
                            </div>
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                          }}>
                            <div style={{
                              background: `${gradeInfo.color}15`,
                              border: `2px solid ${gradeInfo.color}`,
                              borderRadius: '12px',
                              padding: '10px 20px',
                              textAlign: 'center'
                            }}>
                              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: gradeInfo.color }}>{displayLetter}</div>
                            </div>
                            <span style={{
                              backgroundColor: '#dcfce7',
                              color: '#166534',
                              padding: '6px 14px',
                              borderRadius: '20px',
                              fontWeight: 500,
                              fontSize: '0.85rem'
                            }}>
                              ✓ Completed
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Submit Assignment Modal */}
      {showSubmitModal && selectedAssessment && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setShowSubmitModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '500px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              padding: '24px'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem' }}>📤 Submit Assignment</h2>
              <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '0.95rem' }}>
                {selectedCourse?.title}
              </p>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '10px' }}>
                <h4 style={{ margin: '0 0 8px', color: '#1f2937' }}>{selectedAssessment.title}</h4>
                {selectedAssessment.description && (
                  <p style={{ margin: '0 0 12px', color: '#6b7280', fontSize: '0.9rem' }}>{selectedAssessment.description}</p>
                )}
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: '#6b7280' }}>
                  <span>📅 Due: {formatDate(selectedAssessment.dueDate)}</span>
                  {selectedAssessment.totalMarks && <span>💯 {selectedAssessment.totalMarks} marks</span>}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600, color: '#374151' }}>
                  Upload Your File
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip"
                  onChange={handleFileChange}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '14px',
                    border: '2px dashed #d1d5db',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: '#fafafa'
                  }}
                />
                {uploadedFile && (
                  <div style={{ marginTop: '12px', padding: '12px', background: '#dcfce7', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>✅</span>
                    <div>
                      <div style={{ fontWeight: 600, color: '#166534' }}>{uploadedFile.name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#16a34a' }}>{(uploadedFile.size / 1024).toFixed(1)} KB</div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowSubmitModal(false);
                    setUploadedFile(null);
                  }}
                  disabled={submitting}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '10px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontWeight: 500,
                    opacity: submitting ? 0.6 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAssignment}
                  disabled={submitting || !uploadedFile}
                  style={{
                    padding: '12px 24px',
                    background: submitting || !uploadedFile ? '#94a3b8' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: submitting || !uploadedFile ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {submitting ? '⏳ Submitting...' : '✓ Submit Assignment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Assessments;