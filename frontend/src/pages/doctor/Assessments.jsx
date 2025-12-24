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

  const visible =
    selectedCourseId === ""
      ? assessments
      : assessments.filter((a) => String(a.courseId) === String(selectedCourseId));

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
                  <button className={styles.actionBtn} disabled>
                    View Submissions
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default DoctorAssessments;
