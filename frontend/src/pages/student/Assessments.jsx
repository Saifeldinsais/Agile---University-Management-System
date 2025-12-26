import { useState, useEffect, useMemo } from "react";
import styles from "./StudentPages.module.css";
import { API_BASE_URL } from "../../services/config";
import assignmentSubmissionService from "../../services/assignmentSubmissionService";

const gpaToLetter = (gpa) => {
  if (gpa >= 4.0) return { letter: "A", color: "#047857" };
  if (gpa >= 3.7) return { letter: "A-", color: "#047857" };
  if (gpa >= 3.3) return { letter: "B+", color: "#1a56db" };
  if (gpa >= 3.0) return { letter: "B", color: "#1a56db" };
  if (gpa >= 2.7) return { letter: "B-", color: "#1a56db" };
  if (gpa >= 2.3) return { letter: "C+", color: "#d97706" };
  if (gpa >= 2.0) return { letter: "C", color: "#d97706" };
  if (gpa >= 1.7) return { letter: "C-", color: "#d97706" };
  if (gpa >= 1.3) return { letter: "D+", color: "#dc2626" };
  if (gpa >= 1.0) return { letter: "D", color: "#dc2626" };
  return { letter: "F", color: "#6b7280" };
};

function Assessments() {
  const [activeTab, setActiveTab] = useState("assessments");

  const token = useMemo(() => localStorage.getItem("token"), []);
  const authHeaders = useMemo(() => {
    const h = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const [student] = useState(() => {
    const storedUser = localStorage.getItem("user") || localStorage.getItem("student");
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  });

  // State
  const [courseAssessments, setCourseAssessments] = useState([]);
  const [assessmentSummary, setAssessmentSummary] = useState({
    totalAssessments: 0,
    submittedCount: 0,
    gradedCount: 0,
    pendingCount: 0
  });
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [expandedCourses, setExpandedCourses] = useState({});
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [gradesData, setGradesData] = useState({ completedCourses: [], gpa: 0, totalCredits: 0 });
  const [gradesLoading, setGradesLoading] = useState(false);

  useEffect(() => {
    document.title = "Assessments";
  }, []);

  useEffect(() => {
    if (activeTab === "assessments") {
      loadAssessments();
    } else if (activeTab === "grades") {
      loadGrades();
    }
  }, [activeTab]);

  const loadAssessments = async () => {
    if (!token) return;
    setLoadingAssessments(true);
    try {
      const res = await fetch(`${API_BASE_URL}/student/my-assessments`, {
        method: "GET",
        headers: authHeaders,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message);
      setCourseAssessments(Array.isArray(json.data) ? json.data : []);
      setAssessmentSummary(json.summary || { totalAssessments: 0, submittedCount: 0, gradedCount: 0, pendingCount: 0 });
      const expanded = {};
      (json.data || []).forEach(c => {
        if (c.assessmentCount > 0) expanded[c.courseId] = true;
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
      if (!res.ok) throw new Error("Failed to fetch");
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
    setExpandedCourses((prev) => ({ ...prev, [courseId]: !prev[courseId] }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "No deadline";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

  const handleSubmitClick = (assessment, course) => {
    setSelectedAssessment(assessment);
    setSelectedCourse(course);
    setUploadedFile(null);
    setShowSubmitModal(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files?.length > 0) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!uploadedFile || !selectedAssessment) return;
    setSubmitting(true);
    try {
      await assignmentSubmissionService.submitAssignment(selectedAssessment.assessmentId, [uploadedFile]);
      setShowSubmitModal(false);
      setUploadedFile(null);
      setSelectedAssessment(null);
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
      {/* Header */}
      <div className={styles.pageHeader}>
        <h1>Assessments</h1>
        <p>View assignments, submit work, and check grades</p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <button
          onClick={() => setActiveTab("assessments")}
          style={{
            padding: "10px 20px",
            background: activeTab === "assessments" ? "#1a56db" : "#fff",
            color: activeTab === "assessments" ? "#fff" : "#374151",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 500,
            fontSize: "0.875rem",
          }}
        >
          Assignments
        </button>
        <button
          onClick={() => setActiveTab("grades")}
          style={{
            padding: "10px 20px",
            background: activeTab === "grades" ? "#1a56db" : "#fff",
            color: activeTab === "grades" ? "#fff" : "#374151",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 500,
            fontSize: "0.875rem",
          }}
        >
          Transcript
        </button>
      </div>

      <div className={styles.pageContent}>
        {/* Assessments Tab */}
        {activeTab === "assessments" && (
          <div className={styles.section}>
            {/* Summary Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{assessmentSummary.totalAssessments}</div>
                <div className={styles.statLabel}>Total</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{ color: "#d97706" }}>{assessmentSummary.pendingCount}</div>
                <div className={styles.statLabel}>Pending</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{ color: "#1a56db" }}>{assessmentSummary.submittedCount}</div>
                <div className={styles.statLabel}>Submitted</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{ color: "#047857" }}>{assessmentSummary.gradedCount}</div>
                <div className={styles.statLabel}>Graded</div>
              </div>
            </div>

            {loadingAssessments ? (
              <p style={{ color: "#6b7280", textAlign: "center", padding: "40px" }}>Loading...</p>
            ) : courseAssessments.length === 0 ? (
              <p style={{ color: "#6b7280", textAlign: "center", padding: "40px" }}>No assessments found</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {courseAssessments.map((course) => (
                  <div key={course.courseId} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
                    {/* Course Header */}
                    <button
                      onClick={() => toggleCourseExpand(course.courseId)}
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        background: expandedCourses[course.courseId] ? "#f9fafb" : "#fff",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        textAlign: "left",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: "#111827" }}>
                          {course.code && <span style={{ color: "#1a56db" }}>{course.code}</span>}
                          {course.code && " — "}{course.title}
                        </div>
                        <div style={{ fontSize: "0.8125rem", color: "#6b7280", marginTop: "2px" }}>
                          {course.assessmentCount} {course.assessmentCount === 1 ? "assessment" : "assessments"}
                        </div>
                      </div>
                      <span style={{ color: "#6b7280", transform: expandedCourses[course.courseId] ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
                    </button>

                    {/* Assessments List */}
                    {expandedCourses[course.courseId] && (
                      <div style={{ borderTop: "1px solid #e5e7eb" }}>
                        {course.assessments.length === 0 ? (
                          <p style={{ padding: "20px", color: "#9ca3af", textAlign: "center" }}>No assessments</p>
                        ) : (
                          course.assessments.map((assessment) => {
                            const overdue = isOverdue(assessment.dueDate, assessment.isSubmitted);
                            return (
                              <div
                                key={assessment.assessmentId}
                                style={{
                                  padding: "16px",
                                  borderBottom: "1px solid #f3f4f6",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: "16px",
                                  flexWrap: "wrap",
                                }}
                              >
                                <div style={{ flex: 1, minWidth: "200px" }}>
                                  <div style={{ fontWeight: 500, color: "#111827", marginBottom: "4px" }}>
                                    {assessment.title}
                                  </div>
                                  <div style={{ fontSize: "0.8125rem", color: overdue ? "#dc2626" : "#6b7280" }}>
                                    Due: {formatDate(assessment.dueDate)}
                                    {overdue && " (Overdue)"}
                                  </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                  {/* Status */}
                                  {assessment.isGraded ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                      <span className={styles.badgeSuccess}>Graded</span>
                                      <span style={{ fontWeight: 600, fontSize: "1.125rem", color: "#047857" }}>
                                        {assessment.grade}{assessment.totalMarks && `/${assessment.totalMarks}`}
                                      </span>
                                    </div>
                                  ) : assessment.isSubmitted ? (
                                    <span className={styles.badgePrimary}>Submitted</span>
                                  ) : (
                                    <>
                                      <span className={styles.badgeWarning}>Pending</span>
                                      <button
                                        onClick={() => handleSubmitClick(assessment, course)}
                                        className={styles.btnPrimary}
                                      >
                                        Submit
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Grades Tab */}
        {activeTab === "grades" && (
          <div className={styles.section}>
            {gradesLoading ? (
              <p style={{ color: "#6b7280", textAlign: "center", padding: "40px" }}>Loading...</p>
            ) : (
              <>
                {/* GPA Summary */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
                  <div className={styles.statCard} style={{ background: "#e1effe" }}>
                    <div className={styles.statValue} style={{ color: "#1a56db" }}>{gradesData.gpa.toFixed(2)}</div>
                    <div className={styles.statLabel}>GPA</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{gradesData.totalCredits}</div>
                    <div className={styles.statLabel}>Credits</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{gradesData.completedCourses.length}</div>
                    <div className={styles.statLabel}>Courses</div>
                  </div>
                </div>

                {/* Course List */}
                {gradesData.completedCourses.length === 0 ? (
                  <p style={{ color: "#6b7280", textAlign: "center", padding: "40px" }}>No completed courses</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {gradesData.completedCourses.map((course, idx) => {
                      const gradeInfo = gpaToLetter(course.finalGrade);
                      const displayLetter = course.letterGrade || gradeInfo.letter;
                      return (
                        <div
                          key={course.enrollmentId || idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "14px 16px",
                            background: "#f9fafb",
                            borderRadius: "8px",
                            border: "1px solid #e5e7eb",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 500, color: "#111827" }}>{course.title}</div>
                            <div style={{ fontSize: "0.8125rem", color: "#6b7280" }}>
                              {course.code && `${course.code} · `}{course.credits} credits
                            </div>
                          </div>
                          <div style={{
                            padding: "8px 16px",
                            borderRadius: "6px",
                            fontWeight: 600,
                            fontSize: "1.125rem",
                            color: gradeInfo.color,
                            background: gradeInfo.color + "15",
                          }}>
                            {displayLetter}
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

      {/* Submit Modal */}
      {showSubmitModal && selectedAssessment && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setShowSubmitModal(false)}
        >
          <div
            style={{ background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "450px", overflow: "hidden" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb" }}>
              <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600 }}>Submit Assignment</h2>
              <p style={{ margin: "8px 0 0", color: "#6b7280", fontSize: "0.875rem" }}>
                {selectedCourse?.title} — {selectedAssessment.title}
              </p>
            </div>

            <div style={{ padding: "20px 24px" }}>
              <label className={styles.label}>Upload File</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip"
                onChange={handleFileChange}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px dashed #e5e7eb",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              />
              {uploadedFile && (
                <div style={{ marginTop: "12px", padding: "10px", background: "#d1fae5", borderRadius: "6px", fontSize: "0.875rem", color: "#047857" }}>
                  {uploadedFile.name}
                </div>
              )}
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid #e5e7eb", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => { setShowSubmitModal(false); setUploadedFile(null); }}
                className={styles.btnSecondary}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAssignment}
                className={styles.btnPrimary}
                disabled={submitting || !uploadedFile}
                style={{ opacity: submitting || !uploadedFile ? 0.5 : 1 }}
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Assessments;