// src/pages/doctor/Assessments.jsx
import { useEffect, useMemo, useState } from "react";
import styles from "./Assessments.module.css";

function DoctorAssessments() {
  const token = useMemo(() => localStorage.getItem("token"), []);
  const baseURL = "http://localhost:5000";

  const [doctorEntityId, setDoctorEntityId] = useState(null);

  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState("");

  const [assessments, setAssessments] = useState([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(""); // "" = all

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    courseId: "",
    type: "assignment",
    deadline: "",
    totalPoints: 100,
    description: "",
  });

  // Submissions modal state
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Grading state - tracks grade/feedback for each submission by entity_id
  const [grades, setGrades] = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const [gradingSubmission, setGradingSubmission] = useState(null);

  const authHeaders = () => ({ Authorization: `Bearer ${token}` });
  const jsonHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const safeJson = async (res) => {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return { raw: text };
    }
  };

  const mapApiAssessmentToUI = (a) => ({
    id: a.assignmentId ?? a.id,
    courseId: a.courseId,
    title: a.title || "",
    type: (a.type || "assignment").toLowerCase(),
    deadline: a.dueDate || "",
    totalPoints: a.totalMarks ?? 0,
    description: a.description || "",
    status: a.status || "active",
    createdAt: a.createdAt,
  });

  const courseLabelById = (courseId) => {
    const c = courses.find((x) => String(x.id) === String(courseId));
    return c ? `${c.code}: ${c.title}` : `COURSE-${courseId}`;
  };

  const loadMe = async () => {
    const res = await fetch(`${baseURL}/api/auth/me`, { headers: authHeaders() });
    const json = await safeJson(res);
    if (!res.ok) throw new Error(json?.message || "Failed to get current user");

    const id = json?.user?.id ?? json?.user?.data?.id ?? json?.id ?? null;
    if (!id) throw new Error("Current user id (entityId) not found");
    return id;
  };

  const loadCourses = async (entityId) => {
    const res = await fetch(`${baseURL}/api/doctor/courses/${entityId}`, { headers: authHeaders() });
    const json = await safeJson(res);
    if (!res.ok) throw new Error(json?.message || "Failed to load courses");

    return (json?.data || []).map((c) => ({
      id: c.id,
      code: c.code || `COURSE-${c.id}`,
      title: c.title || "Untitled",
    }));
  };

  const loadAssessmentsForCourse = async (courseId) => {
    const res = await fetch(`${baseURL}/api/doctor/courses/${courseId}/assignments`, {
      headers: authHeaders(),
    });
    const json = await safeJson(res);
    if (!res.ok) throw new Error(json?.message || "Failed to load assessments");
    return (json?.data || []).map(mapApiAssessmentToUI);
  };

  const loadAllAssessments = async (coursesList) => {
    const results = await Promise.allSettled(
      coursesList.map((c) => loadAssessmentsForCourse(c.id))
    );

    const merged = [];
    for (const r of results) if (r.status === "fulfilled") merged.push(...r.value);

    merged.sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });

    return merged;
  };

  const refreshAll = async () => {
    setLoadingAssessments(true);
    try {
      const all = await loadAllAssessments(courses);
      setAssessments(all);
    } finally {
      setLoadingAssessments(false);
    }
  };

  const apiCreate = async () => {
    const res = await fetch(`${baseURL}/api/doctor/courses/${formData.courseId}/assignments`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        doctorId: doctorEntityId,
        title: formData.title,
        description: formData.description || "",
        dueDate: formData.deadline,
        totalMarks: Number(formData.totalPoints),
        type: formData.type,
      }),
    });

    const json = await safeJson(res);
    if (!res.ok) throw new Error(json?.message || "Create failed");
  };

  const apiUpdate = async () => {
    const res = await fetch(`${baseURL}/api/doctor/assignments/${editingId}`, {
      method: "PUT",
      headers: jsonHeaders(),
      body: JSON.stringify({
        doctorId: doctorEntityId,
        title: formData.title,
        description: formData.description || "",
        dueDate: formData.deadline,
        totalMarks: Number(formData.totalPoints),
        type: formData.type,
      }),
    });

    const json = await safeJson(res);
    if (!res.ok) throw new Error(json?.message || "Update failed");
  };

  const resetForm = () => {
    setFormData({
      title: "",
      courseId: "",
      type: "assignment",
      deadline: "",
      totalPoints: 100,
      description: "",
    });
    setIsEditing(false);
    setEditingId(null);
  };

  // init
  useEffect(() => {
    const run = async () => {
      try {
        setLoadingCourses(true);
        setCoursesError("");

        const id = await loadMe();
        setDoctorEntityId(id);

        const list = await loadCourses(id);
        setCourses(list);

        setLoadingAssessments(true);
        const all = await loadAllAssessments(list);
        setAssessments(all);
      } catch (e) {
        setCoursesError(e.message || "Failed to load");
      } finally {
        setLoadingCourses(false);
        setLoadingAssessments(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.courseId) throw new Error("Select course");
      if (!formData.title) throw new Error("Title required");
      if (!formData.deadline) throw new Error("Deadline required");

      if (isEditing) await apiUpdate();
      else await apiCreate();

      setShowCreateForm(false);
      resetForm();
      await refreshAll();
    } catch (err) {
      alert(err.message || "Error");
    }
  };

  const startEdit = (a) => {
    setShowCreateForm(true);
    setIsEditing(true);
    setEditingId(a.id);

    setFormData({
      title: a.title || "",
      courseId: String(a.courseId || ""),
      type: a.type || "assignment",
      deadline: a.deadline || "",
      totalPoints: a.totalPoints ?? 100,
      description: a.description || "",
    });
  };

  // Load submissions for an assignment
  const loadSubmissions = async (assignmentId) => {
    setLoadingSubmissions(true);
    try {
      const res = await fetch(
        `${baseURL}/api/assignmentsubmission/assignment/${assignmentId}/submissions`,
        { headers: authHeaders() }
      );
      const json = await safeJson(res);

      if (!res.ok) throw new Error(json?.message || "Failed to load submissions");

      // Fetch student details for each submission
      const submissionsWithStudents = await Promise.all(
        (json.data || []).map(async (sub) => {
          try {
            const studentRes = await fetch(
              `${baseURL}/api/student/profile/${sub.student_id}`,
              { headers: authHeaders() }
            );
            const studentData = await safeJson(studentRes);

            return {
              ...sub,
              studentName: studentData?.user?.username || studentData?.username || `Student ${sub.student_id}`,
              studentEmail: studentData?.user?.email || studentData?.email || 'N/A'
            };
          } catch (e) {
            return {
              ...sub,
              studentName: `Student ${sub.student_id}`,
              studentEmail: 'N/A'
            };
          }
        })
      );

      setSubmissions(submissionsWithStudents);
    } catch (err) {
      alert(err.message || "Failed to load submissions");
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Handle grading a submission
  const handleGradeSubmit = async (submissionId) => {
    const grade = grades[submissionId];
    const feedback = feedbacks[submissionId] || "";

    if (grade === undefined || grade === "" || grade === null) {
      alert("Please enter a grade");
      return;
    }

    const gradeNum = parseFloat(grade);
    if (isNaN(gradeNum) || gradeNum < 0) {
      alert("Please enter a valid grade (0 or higher)");
      return;
    }

    if (selectedAssignment && gradeNum > selectedAssignment.totalPoints) {
      alert(`Grade cannot exceed total points (${selectedAssignment.totalPoints})`);
      return;
    }

    setGradingSubmission(submissionId);
    try {
      const res = await fetch(`${baseURL}/api/assignmentsubmission/${submissionId}/grade`, {
        method: "PUT",
        headers: jsonHeaders(),
        body: JSON.stringify({ grade: gradeNum, feedback }),
      });

      const json = await safeJson(res);
      if (!res.ok) throw new Error(json?.message || "Failed to grade submission");

      alert("Grade saved successfully!");

      // Update local submission to show graded status
      setSubmissions(prev => prev.map(sub =>
        sub.entity_id === submissionId
          ? { ...sub, grade: gradeNum, feedback, status: 'graded' }
          : sub
      ));
    } catch (err) {
      alert(err.message || "Failed to save grade");
    } finally {
      setGradingSubmission(null);
    }
  };

  const visible =
    selectedCourseId === ""
      ? assessments
      : assessments.filter((a) => String(a.courseId) === String(selectedCourseId));

  const getFileUrl = (path) => {
    if (!path) return "#";
    // Normalize slashes
    let cleanPath = path.replace(/\\/g, "/");
    // Ensure leading slash
    if (!cleanPath.startsWith("/")) {
      cleanPath = "/" + cleanPath;
    }
    return `${baseURL}${cleanPath}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Assessments</h1>
          <p className={styles.subtitle}>Create and manage assessments across your assigned courses</p>
        </div>

        <button
          className={styles.createBtn}
          onClick={() => {
            const next = !showCreateForm;
            setShowCreateForm(next);
            if (!next) resetForm();
            if (next) resetForm();
          }}
          disabled={loadingCourses || !!coursesError}
        >
          {showCreateForm ? "Back to list" : "+ Create Assessment"}
        </button>
      </div>

      {coursesError && <div className={styles.alertError}>{coursesError}</div>}

      {!showCreateForm && (
        <div className={styles.toolbar}>
          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>Filter:</div>
            <select
              className={styles.select}
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              disabled={loadingCourses || courses.length === 0}
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}: {c.title}
                </option>
              ))}
            </select>
          </div>

          <button className={styles.refreshBtn} onClick={refreshAll} disabled={loadingAssessments || courses.length === 0}>
            {loadingAssessments ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      )}

      {showCreateForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Assessment Title</label>
            <input className={styles.input} name="title" value={formData.title} onChange={handleInputChange} />
          </div>

          <div className={styles.formGroup}>
            <label>Description (optional)</label>
            <textarea className={styles.textarea} name="description" value={formData.description} onChange={handleInputChange} />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Course</label>
              <select className={styles.selectInput} name="courseId" value={formData.courseId} onChange={handleInputChange} disabled={isEditing}>
                <option value="">Select course...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}: {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Type</label>
              <select className={styles.selectInput} name="type" value={formData.type} onChange={handleInputChange}>
                <option value="assignment">Assignment</option>
                <option value="quiz">Quiz</option>
                <option value="exam">Exam</option>
                <option value="project">Project</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Deadline</label>
              <input className={styles.input} type="date" name="deadline" value={formData.deadline} onChange={handleInputChange} />
            </div>

            <div className={styles.formGroup}>
              <label>Total Points</label>
              <input className={styles.input} type="number" name="totalPoints" value={formData.totalPoints} onChange={handleInputChange} />
            </div>
          </div>

          <button className={styles.submitBtn} type="submit" disabled={!doctorEntityId}>
            {isEditing ? "Update Assessment" : "Create Assessment"}
          </button>
        </form>
      )}

      {!showCreateForm && (
        <div className={styles.assessmentsList}>
          {loadingAssessments ? (
            <p className={styles.empty}>Loading assessments...</p>
          ) : visible.length === 0 ? (
            <p className={styles.empty}>No assessments found</p>
          ) : (
            visible.map((a) => (
              <div key={a.id} className={styles.assessmentCard}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3>{a.title}</h3>
                    <p className={styles.course}>{courseLabelById(a.courseId)}</p>
                  </div>
                  <span className={`${styles.badge} ${styles[a.status] || styles.active}`}>{a.status}</span>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.detail}>
                    <span className={styles.label}>Type:</span>
                    <span>{a.type}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.label}>Deadline:</span>
                    <span>{a.deadline}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.label}>Total Points:</span>
                    <span>{a.totalPoints}</span>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button className={styles.actionBtn} onClick={() => startEdit(a)}>
                    Edit
                  </button>
                  <button
                    className={styles.actionBtn}
                    onClick={() => {
                      setSelectedAssignment(a);
                      setShowSubmissionsModal(true);
                      loadSubmissions(a.id);
                    }}
                  >
                    View Submissions
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissionsModal && selectedAssignment && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Submissions: {selectedAssignment.title}</h2>
              <button
                onClick={() => {
                  setShowSubmissionsModal(false);
                  setSelectedAssignment(null);
                  setSubmissions([]);
                }}
                style={{
                  background: '#e5e7eb',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Close
              </button>
            </div>

            {loadingSubmissions ? (
              <p style={{ color: '#6b7280' }}>Loading submissions...</p>
            ) : submissions.length === 0 ? (
              <p style={{ color: '#6b7280' }}>No submissions yet</p>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {submissions.map((sub, idx) => (
                  <div key={sub.entity_id || idx} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: '#f9fafb'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>
                          {sub.studentName}
                        </h3>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                          {sub.studentEmail}
                        </p>
                      </div>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: '#d1fae5',
                        color: '#065f46'
                      }}>
                        Submitted
                      </span>
                    </div>

                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                      <strong>Student ID:</strong> {sub.student_id}
                    </div>

                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                      <strong>Submitted:</strong> {sub.created_at ? new Date(sub.created_at).toLocaleString() : 'N/A'}
                    </div>

                    {/* Show files if available */}
                    {sub.files && sub.files.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <strong style={{ fontSize: '14px' }}>Files:</strong>
                        <div style={{ display: 'grid', gap: '8px', marginTop: '8px' }}>
                          {sub.files.map((file, fileIdx) => (
                            <div key={fileIdx} style={{
                              padding: '8px 12px',
                              backgroundColor: 'white',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '14px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <span>📎 {file.file_name} ({(file.file_size / 1024).toFixed(1)} KB)</span>
                              <a
                                href={getFileUrl(file.file_path)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  backgroundColor: '#2563eb',
                                  color: 'white',
                                  textDecoration: 'none',
                                  padding: '4px 12px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}
                              >
                                Download
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Grading Section */}
                    <div style={{
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#374151' }}>
                        📝 Grade Submission
                      </h4>

                      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
                        <label style={{ fontSize: '14px', color: '#6b7280', minWidth: '60px' }}>
                          Grade:
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={selectedAssignment?.totalPoints || 100}
                          placeholder={`0 - ${selectedAssignment?.totalPoints || 100}`}
                          value={grades[sub.entity_id] ?? (sub.grade || '')}
                          onChange={(e) => setGrades(prev => ({ ...prev, [sub.entity_id]: e.target.value }))}
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            width: '120px'
                          }}
                        />
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>
                          / {selectedAssignment?.totalPoints || 100} points
                        </span>
                      </div>

                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '14px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>
                          Feedback (optional):
                        </label>
                        <textarea
                          placeholder="Enter feedback for the student..."
                          value={feedbacks[sub.entity_id] ?? (sub.feedback || '')}
                          onChange={(e) => setFeedbacks(prev => ({ ...prev, [sub.entity_id]: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            minHeight: '80px',
                            resize: 'vertical',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <button
                        onClick={() => handleGradeSubmit(sub.entity_id)}
                        disabled={gradingSubmission === sub.entity_id}
                        style={{
                          backgroundColor: gradingSubmission === sub.entity_id ? '#9ca3af' : '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: gradingSubmission === sub.entity_id ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {gradingSubmission === sub.entity_id ? 'Saving...' : '✓ Save Grade'}
                      </button>

                      {sub.status === 'graded' && (
                        <span style={{
                          marginLeft: '12px',
                          color: '#10b981',
                          fontSize: '14px'
                        }}>
                          ✓ Graded
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorAssessments;
