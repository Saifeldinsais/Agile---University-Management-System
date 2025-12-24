import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import styles from "./CourseDetail.module.css";

const API = "http://localhost:5000";

function DoctorCourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [assignments, setAssignments] = useState([]);
  const [resources, setResources] = useState([]);

  // add assignment
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", dueDate: "" });
  const [submitting, setSubmitting] = useState(false);

  // edit assignment
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({ title: "", description: "", dueDate: "", totalMarks: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  // upload
  const [uploadingFor, setUploadingFor] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCourseDetail();
    fetchAssignments();
    fetchResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchCourseDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      if (location.state?.course) {
        setCourse(location.state.course);
        return;
      }

      const userId = localStorage.getItem("userId");
      if (!userId) {
        setError("User not found. Please login again.");
        return;
      }

      // Placeholder (keep as your current behavior)
      setCourse({
        entity_id: courseId,
        code: "COURSE-" + courseId,
        title: "Course Title",
        description: "Course Description",
        credits: 3,
        semester: "Fall 2024",
        department: "Computer Science",
      });
    } catch (err) {
      console.error("Error fetching course detail:", err);
      setError("Error loading course details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await axios.get(`${API}/api/doctor/courses/${courseId}/assignments`);
      if (response.data.status === "success") {
        setAssignments(response.data.data || []);
      } else {
        setAssignments([]);
      }
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setAssignments([]);
    }
  };

  const fetchResources = async () => {
    try {
      const response = await axios.get(`${API}/api/doctor/courses/${courseId}/resources`);
      if (response.data.status === "success") {
        setResources(response.data.data || []);
      } else {
        setResources([]);
      }
    } catch (err) {
      console.error("Error fetching resources:", err);
      setResources([]);
    }
  };

  const groupResourcesByCategory = () => {
    const grouped = {};
    resources.forEach((res) => {
      const cat = res.category || "Other";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(res);
    });
    return grouped;
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.dueDate) {
      alert("Please fill in title and due date");
      return;
    }

    try {
      setSubmitting(true);

      const doctorId = localStorage.getItem("userId");
      if (!doctorId) {
        alert("Doctor not logged in");
        return;
      }

      const response = await axios.post(`${API}/api/doctor/courses/${courseId}/assignments`, {
        doctorId: Number(doctorId),
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
      });

      if (response.data.status === "success") {
        setFormData({ title: "", description: "", dueDate: "" });
        setShowAddForm(false);
        await fetchAssignments();
        alert("Assignment created successfully!");
      } else {
        alert(response.data.message || "Failed to create assignment");
      }
    } catch (err) {
      console.error("Error creating assignment:", err);
      alert(err.response?.data?.message || "Error creating assignment");
    } finally {
      setSubmitting(false);
    }
  };

  // -------- EDIT --------
  const openEdit = (assignment) => {
    setEditing(assignment);
    setEditData({
      title: assignment.title || "",
      description: assignment.description || "",
      dueDate: assignment.dueDate ? toDatetimeLocal(assignment.dueDate) : "",
      totalMarks: assignment.totalMarks ?? "",
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setEditData({ title: "", description: "", dueDate: "", totalMarks: "" });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editing?.assignmentId) return;

    try {
      setSavingEdit(true);
      const doctorId = localStorage.getItem("userId");
      if (!doctorId) {
        alert("Doctor not logged in");
        return;
      }

      const payload = {
        doctorId: Number(doctorId),
        title: editData.title,
        description: editData.description,
        dueDate: editData.dueDate,
      };

      if (editData.totalMarks !== "" && editData.totalMarks !== null && editData.totalMarks !== undefined) {
        payload.totalMarks = Number(editData.totalMarks);
      }

      const res = await axios.put(`${API}/api/doctor/assignments/${editing.assignmentId}`, payload);

      if (res.data.status === "success") {
        await fetchAssignments();
        closeEdit();
        alert("Assignment updated!");
      } else {
        alert(res.data.message || "Update failed");
      }
    } catch (err) {
      console.error("Error updating assignment:", err);
      alert(err.response?.data?.message || "Error updating assignment");
    } finally {
      setSavingEdit(false);
    }
  };

  // -------- UPLOAD --------
  const openUpload = (assignmentId) => {
    setUploadingFor(assignmentId);
    setUploadFile(null);
    setUploadName("");
  };

  const closeUpload = () => {
    setUploadingFor(null);
    setUploadFile(null);
    setUploadName("");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadingFor) return;
    if (!uploadFile) {
      alert("Choose a file first");
      return;
    }

    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("name", uploadName || uploadFile.name);

      const res = await axios.post(
        `${API}/api/doctor/assignments/${uploadingFor}/attachments/upload`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data.status === "success") {
        await fetchAssignments();
        closeUpload();
        alert("Attachment uploaded!");
      } else {
        alert(res.data.message || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.response?.data?.message || "Error uploading file");
    } finally {
      setUploading(false);
    }
  };

  // helpers
  const parseAttachments = (a) => {
    try {
      if (!a?.attachments) return [];
      if (Array.isArray(a.attachments)) return a.attachments;
      return JSON.parse(a.attachments);
    } catch {
      return [];
    }
  };

  const toDatetimeLocal = (iso) => {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
      d.getMinutes()
    )}`;
  };

  if (loading) {
    return (
      <div className={styles.center}>
        <h2>Loading course details...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.alertError}>{error}</div>
        <button className={styles.btnSecondary} onClick={() => navigate("/doctor/courses")}>
          Back to My Courses
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.btnSecondary} onClick={() => navigate("/doctor/courses")}>
          Back to My Courses
        </button>

        <div className={styles.topRight}>
          <button className={styles.btnPrimary} onClick={() => setShowAddForm((p) => !p)}>
            {showAddForm ? "Close Add Form" : "Add Assignment"}
          </button>
        </div>
      </div>

      {course && (
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.code}>{course.code}</div>
            <div className={styles.title}>{course.title}</div>
          </div>

          <div className={styles.gridTwo}>
            <div>
              <div className={styles.label}>Description</div>
              <div className={styles.text}>{course.description || "No description available"}</div>
            </div>

            <div className={styles.meta}>
              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Credits</span>
                <span className={styles.metaVal}>{parseInt(course.credits, 10) || 0}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Semester</span>
                <span className={styles.metaVal}>{course.semester || "N/A"}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Department</span>
                <span className={styles.metaVal}>{course.department || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Add form */}
          {showAddForm && (
            <form className={styles.form} onSubmit={handleAddAssignment}>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Assignment Title *</label>
                <input
                  className={styles.input}
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  className={styles.textarea}
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Due Date *</label>
                <input
                  className={styles.input}
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData((p) => ({ ...p, dueDate: e.target.value }))}
                  required
                />
              </div>

              <div className={styles.formActions}>
                <button className={styles.btnSuccess} type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create"}
                </button>
                <button className={styles.btnSecondary} type="button" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Course Resources */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Course Resources & Materials</div>

            {resources.length === 0 ? (
              <div className={styles.muted}>No resources uploaded yet.</div>
            ) : (
              <div className={styles.resourcesContainer}>
                {Object.entries(groupResourcesByCategory()).map(([category, items]) => (
                  <div className={styles.resourceCategory} key={category}>
                    <div className={styles.categoryHeading}>{category}</div>
                    {items[0]?.categoryDescription && (
                      <div className={styles.categoryDescription}>{items[0].categoryDescription}</div>
                    )}
                    <div className={styles.filesList}>
                      {items.map((res) => (
                        <div className={styles.fileItem} key={res.resource_id}>
                          <a
                            className={styles.fileLink}
                            href={`${API}${res.file_path}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            📄 {res.title || res.file_name}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assignments */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Assignments</div>

            {assignments.length === 0 ? (
              <div className={styles.muted}>No assignments yet.</div>
            ) : (
              <div className={styles.list}>
                {assignments.map((assignment) => {
                  const att = parseAttachments(assignment);
                  return (
                    <div className={styles.assignmentCard} key={assignment.assignmentId || assignment.id}>
                      <div className={styles.assignmentTop}>
                        <div>
                          <div className={styles.assignmentTitle}>{assignment.title || "Untitled Assignment"}</div>
                          <div className={styles.assignmentSub}>
                            Due:{" "}
                            {assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : "No due date"}
                          </div>
                        </div>

                        <div className={styles.actions}>
                          <button className={styles.btnSecondarySmall} onClick={() => openEdit(assignment)}>
                            Edit
                          </button>
                          <button className={styles.btnPrimarySmall} onClick={() => openUpload(assignment.assignmentId)}>
                            Upload
                          </button>
                        </div>
                      </div>

                      {assignment.description ? (
                        <div className={styles.assignmentDesc}>{assignment.description}</div>
                      ) : null}

                      <div className={styles.attachments}>
                        <div className={styles.attachTitle}>Attachments</div>

                        {att.length === 0 ? (
                          <div className={styles.mutedSmall}>No attachments yet.</div>
                        ) : (
                          <ul className={styles.attachList}>
                            {att.map((x, idx) => (
                              <li key={idx}>
                                <a className={styles.link} href={`${API}${x.url}`} target="_blank" rel="noreferrer">
                                  {x.name || x.originalname || "attachment"}
                                </a>
                                <span className={styles.mutedSmall}> ({x.mimetype || "file"})</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editing && (
        <div className={styles.modalOverlay} onClick={closeEdit}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>Edit Assignment</div>

            <form onSubmit={handleSaveEdit}>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Title</label>
                <input
                  className={styles.input}
                  value={editData.title}
                  onChange={(e) => setEditData((p) => ({ ...p, title: e.target.value }))}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  className={styles.textarea}
                  value={editData.description}
                  onChange={(e) => setEditData((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Due Date</label>
                <input
                  className={styles.input}
                  type="datetime-local"
                  value={editData.dueDate}
                  onChange={(e) => setEditData((p) => ({ ...p, dueDate: e.target.value }))}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Total Marks (optional)</label>
                <input
                  className={styles.input}
                  type="number"
                  value={editData.totalMarks}
                  onChange={(e) => setEditData((p) => ({ ...p, totalMarks: e.target.value }))}
                />
              </div>

              <div className={styles.formActions}>
                <button className={styles.btnSuccess} type="submit" disabled={savingEdit}>
                  {savingEdit ? "Saving..." : "Save"}
                </button>
                <button className={styles.btnSecondary} type="button" onClick={closeEdit}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {uploadingFor && (
        <div className={styles.modalOverlay} onClick={closeUpload}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>Upload Attachment</div>

            <form onSubmit={handleUpload}>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Attachment Name (optional)</label>
                <input
                  className={styles.input}
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. Sheet1.pdf"
                />
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>File *</label>
                <input
                  className={styles.file}
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  required
                />
                <div className={styles.mutedSmall}>Allowed: pdf/doc/docx/ppt/pptx/png/jpg/txt (max 10MB)</div>
              </div>

              <div className={styles.formActions}>
                <button className={styles.btnPrimary} type="submit" disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload"}
                </button>
                <button className={styles.btnSecondary} type="button" onClick={closeUpload}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorCourseDetail;
