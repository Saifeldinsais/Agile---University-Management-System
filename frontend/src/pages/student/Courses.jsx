import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../services/config";
import styles from "./StudentPages.module.css";

function Courses() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Courses";
  }, []);

  const token = useMemo(() => localStorage.getItem("token"), []);
  const authHeaders = useMemo(() => {
    const h = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  // State
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [courseMaterials, setCourseMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [expandedCourses, setExpandedCourses] = useState({});
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [instructors, setInstructors] = useState([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [officeHours, setOfficeHours] = useState([]);
  const [loadingHours, setLoadingHours] = useState(false);
  const [requestedDate, setRequestedDate] = useState("");
  const [requestedTime, setRequestedTime] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);

  const approvedMeetings = useMemo(
    () => meetings.filter((m) => String(m.status).toLowerCase() === "approved"),
    [meetings]
  );

  // Helpers
  const dayNameToIndex = (day) => {
    const map = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
    return map[String(day || "").trim()] ?? null;
  };

  const toYMD = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const nextDateForDay = (dayName, baseDateStr) => {
    const targetDow = dayNameToIndex(dayName);
    if (targetDow === null) return "";
    const base = baseDateStr ? new Date(`${baseDateStr}T00:00:00`) : new Date();
    if (Number.isNaN(base.getTime())) return "";
    base.setHours(0, 0, 0, 0);
    const currentDow = base.getDay();
    let diff = (targetDow - currentDow + 7) % 7;
    const result = new Date(base);
    result.setDate(base.getDate() + diff);
    return toYMD(result);
  };

  const selectedDateDow = useMemo(() => {
    if (!requestedDate) return null;
    const d = new Date(`${requestedDate}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    return d.getDay();
  }, [requestedDate]);

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        const res = await fetch(`${API_BASE_URL}/student/viewCourses`);
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data?.message || "Failed to fetch courses");
        setCourses(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("fetchCourses error:", e);
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  // Fetch materials
  const fetchCourseMaterials = async () => {
    if (!token) return;
    try {
      setLoadingMaterials(true);
      setShowMaterialsModal(true);
      const res = await fetch(`${API_BASE_URL}/student/my-course-materials`, {
        method: "GET",
        headers: authHeaders,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Failed to fetch materials");
      setCourseMaterials(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      console.error("fetchCourseMaterials error:", e);
      setCourseMaterials([]);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const toggleCourseExpand = (courseId) => {
    setExpandedCourses((prev) => ({ ...prev, [courseId]: !prev[courseId] }));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  // Fetch instructors
  useEffect(() => {
    const fetchInstructors = async () => {
      if (!selectedCourseId) {
        setInstructors([]);
        setSelectedStaffId("");
        setOfficeHours([]);
        setSelectedSlotId(null);
        setRequestedTime("");
        return;
      }
      try {
        setLoadingInstructors(true);
        const res = await fetch(`${API_BASE_URL}/student/courses/${selectedCourseId}/instructors`, {
          method: "GET",
          headers: authHeaders,
        });
        const json = await res.json().catch(() => ({}));
        if (json.status === "success" && Array.isArray(json.data)) {
          setInstructors(json.data);
        } else {
          setInstructors([]);
        }
      } catch (e) {
        console.error("fetchInstructors error:", e);
        setInstructors([]);
      } finally {
        setLoadingInstructors(false);
      }
    };
    fetchInstructors();
  }, [selectedCourseId, authHeaders]);

  // Fetch office hours
  useEffect(() => {
    const fetchHours = async () => {
      if (!selectedStaffId) {
        setOfficeHours([]);
        setSelectedSlotId(null);
        setRequestedTime("");
        return;
      }
      try {
        setLoadingHours(true);
        const res = await fetch(`${API_BASE_URL}/student/staff/${selectedStaffId}/office-hours`, {
          method: "GET",
          headers: authHeaders,
        });
        const json = await res.json().catch(() => ({}));
        if (json.status === "success" && Array.isArray(json.data)) {
          setOfficeHours(json.data);
        } else {
          setOfficeHours([]);
        }
      } catch (e) {
        console.error("fetchHours error:", e);
        setOfficeHours([]);
      } finally {
        setLoadingHours(false);
      }
    };
    fetchHours();
  }, [selectedStaffId, authHeaders]);

  // Fetch meetings
  useEffect(() => {
    const fetchMeetings = async () => {
      if (!token) return;
      try {
        setLoadingMeetings(true);
        const res = await fetch(`${API_BASE_URL}/student/meeting-requests`, {
          method: "GET",
          headers: authHeaders,
        });
        const json = await res.json().catch(() => ({}));
        if (Array.isArray(json.data)) {
          setMeetings(json.data);
        } else if (Array.isArray(json)) {
          setMeetings(json);
        } else {
          setMeetings([]);
        }
      } catch (e) {
        console.error("fetchMeetings error:", e);
        setMeetings([]);
      } finally {
        setLoadingMeetings(false);
      }
    };
    fetchMeetings();
  }, [authHeaders, token]);

  // Submit meeting request
  const submitMeetingRequest = async () => {
    if (!selectedStaffId || !requestedDate || !requestedTime) {
      alert("Please complete all fields.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/student/staff/${selectedStaffId}/meeting-requests`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          date: requestedDate,
          time: requestedTime,
          reason: reason || "Office hours visit",
          officeHourId: selectedSlotId ?? undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Failed to submit");
      alert("Request submitted");
      setSelectedSlotId(null);
      setRequestedTime("");
      setReason("");
    } catch (e) {
      console.error("submit meeting request error:", e);
      alert("Error submitting request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <h1>Courses</h1>
        <p>Access materials, instructors, and schedule appointments</p>
      </div>

      <div className={styles.pageContent}>
        {/* Quick Actions */}
        <div className={styles.section}>
          <h2>Quick Access</h2>
          <div className={styles.featureList}>
            <button
              type="button"
              className={styles.feature}
              onClick={fetchCourseMaterials}
            >
              <h3>Course Materials</h3>
              <p>Syllabi, lecture notes, resources</p>
            </button>

            <button
              type="button"
              className={styles.feature}
              onClick={() => navigate("/student/schedule")}
            >
              <h3>Class Schedule</h3>
              <p>View timings and locations</p>
            </button>
          </div>
        </div>

        {/* Office Hours Request */}
        <div className={styles.section}>
          <h2>Request Office Hours</h2>

          <div style={{ display: "grid", gap: "16px", marginTop: "16px" }}>
            {/* Course Selection */}
            <div>
              <label className={styles.label}>Course</label>
              {loadingCourses ? (
                <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Loading...</p>
              ) : (
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className={styles.select}
                >
                  <option value="">Select a course</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.code ? `${c.code} - ` : ""}{c.title || `Course ${c._id}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Instructor Selection */}
            {selectedCourseId && (
              <div>
                <label className={styles.label}>Instructor</label>
                {loadingInstructors ? (
                  <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Loading...</p>
                ) : instructors.length > 0 ? (
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className={styles.select}
                  >
                    <option value="">Select instructor</option>
                    {instructors.map((i) => (
                      <option key={i.staffId} value={i.staffId}>
                        {i.name} ({i.role})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>No instructors found</p>
                )}
              </div>
            )}

            {/* Date Selection */}
            {selectedStaffId && (
              <div>
                <label className={styles.label}>Date</label>
                <input
                  type="date"
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  min={toYMD(new Date())}
                  className={styles.select}
                />
              </div>
            )}

            {/* Time Slots */}
            {selectedStaffId && requestedDate && (
              <div>
                <label className={styles.label}>Available Time Slots</label>
                {loadingHours ? (
                  <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Loading...</p>
                ) : officeHours.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {officeHours
                      .filter((slot) => {
                        const slotDow = dayNameToIndex(slot.day_of_week);
                        return slotDow === selectedDateDow;
                      })
                      .map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => {
                            setSelectedSlotId(slot.id);
                            setRequestedTime(slot.start_time);
                          }}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "6px",
                            border: selectedSlotId === slot.id ? "2px solid #1a56db" : "1px solid #e5e7eb",
                            background: selectedSlotId === slot.id ? "#e1effe" : "#fff",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                          }}
                        >
                          {slot.start_time} - {slot.end_time}
                        </button>
                      ))}
                  </div>
                ) : (
                  <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>No slots for this day</p>
                )}
              </div>
            )}

            {/* Reason */}
            {requestedTime && (
              <div>
                <label className={styles.label}>Reason (optional)</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Brief description"
                  className={styles.select}
                />
              </div>
            )}

            {/* Submit Button */}
            {requestedTime && (
              <div>
                <button
                  onClick={submitMeetingRequest}
                  disabled={submitting}
                  className={styles.btnPrimary}
                  style={{ opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Meetings */}
        {approvedMeetings.length > 0 && (
          <div className={styles.section}>
            <h2>Upcoming Meetings</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
              {approvedMeetings.map((m) => {
                const dateStr = m.date ? new Date(m.date).toLocaleDateString() : "—";
                const timeStr = m.time || "—";
                return (
                  <div
                    key={m.id}
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
                      <div style={{ fontWeight: 500, color: "#111827" }}>{dateStr} at {timeStr}</div>
                      {m.reason && <div style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "2px" }}>{m.reason}</div>}
                    </div>
                    <span className={styles.badgeSuccess}>Confirmed</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Materials Modal */}
      {showMaterialsModal && (
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
          onClick={() => setShowMaterialsModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "700px",
              maxHeight: "80vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600 }}>Course Materials</h2>
              <button
                onClick={() => setShowMaterialsModal(false)}
                style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#6b7280" }}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
              {loadingMaterials ? (
                <p style={{ color: "#6b7280", textAlign: "center", padding: "40px" }}>Loading...</p>
              ) : courseMaterials.length === 0 ? (
                <p style={{ color: "#6b7280", textAlign: "center", padding: "40px" }}>No materials available</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {courseMaterials.map((course) => (
                    <div key={course.courseId} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
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
                            {course.resourceCount} {course.resourceCount === 1 ? "file" : "files"}
                          </div>
                        </div>
                        <span style={{ color: "#6b7280", transform: expandedCourses[course.courseId] ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                          ▼
                        </span>
                      </button>

                      {expandedCourses[course.courseId] && (
                        <div style={{ padding: "12px 16px", borderTop: "1px solid #e5e7eb" }}>
                          {course.resources.length === 0 ? (
                            <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>No files</p>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              {course.resources.map((resource) => (
                                <div key={resource.resourceId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#f9fafb", borderRadius: "6px" }}>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 500, color: "#111827", fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {resource.title}
                                    </div>
                                    <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                                      {formatFileSize(resource.fileSize)}
                                    </div>
                                  </div>
                                  <a
                                    href={`http://localhost:5000${resource.filePath}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      padding: "6px 12px",
                                      background: "#1a56db",
                                      color: "#fff",
                                      borderRadius: "6px",
                                      textDecoration: "none",
                                      fontSize: "0.8125rem",
                                      fontWeight: 500,
                                      flexShrink: 0,
                                    }}
                                  >
                                    Download
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Courses;
