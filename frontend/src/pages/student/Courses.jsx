import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../services/config";
import styles from "./StudentPages.module.css";

function Courses() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "My Courses - Curriculum & Materials";
  }, []);

  // ===== Auth =====
  const token = useMemo(() => localStorage.getItem("token"), []);
  const authHeaders = useMemo(() => {
    const h = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  // ===== Courses =====
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // ===== Course Materials =====
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [courseMaterials, setCourseMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [expandedCourses, setExpandedCourses] = useState({});

  // ===== Selection: Course -> Instructors -> OfficeHours =====
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const [instructors, setInstructors] = useState([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);

  // store STAFF ID (API returns staffId)
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [officeHours, setOfficeHours] = useState([]);
  const [loadingHours, setLoadingHours] = useState(false);

  // ===== Meeting request form =====
  const [requestedDate, setRequestedDate] = useState("");
  const [requestedTime, setRequestedTime] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // chosen slot
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  // ===== Meeting reminders =====
  const [meetings, setMeetings] = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);

  const approvedMeetings = useMemo(
    () => meetings.filter((m) => String(m.status).toLowerCase() === "approved"),
    [meetings]
  );

  // =========================
  // Helpers: weekday + next occurrence date
  // =========================
  const dayNameToIndex = (day) => {
    const map = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };
    return map[String(day || "").trim()] ?? null;
  };

  const toYMD = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // baseDateStr:
  // - if user selected a date, we compute next occurrence from that date
  // - else compute from today
  const nextDateForDay = (dayName, baseDateStr) => {
    const targetDow = dayNameToIndex(dayName);
    if (targetDow === null) return "";

    const base = baseDateStr ? new Date(`${baseDateStr}T00:00:00`) : new Date();
    if (Number.isNaN(base.getTime())) return "";

    // normalize to start of day
    base.setHours(0, 0, 0, 0);

    const currentDow = base.getDay();
    let diff = (targetDow - currentDow + 7) % 7;

    // If base is today but we want "next occurrence":
    // keep diff=0 meaning "today" (useful if selected date matches)
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

  // =========================
  // 0) Fetch courses list
  // =========================
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

  // =========================
  // Fetch Course Materials
  // =========================
  const fetchCourseMaterials = async () => {
    if (!token) {
      alert("Please log in to view course materials.");
      return;
    }

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
    setExpandedCourses((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return "📄";
    const type = fileType.toLowerCase();
    if (type.includes("pdf")) return "📕";
    if (type.includes("word") || type.includes("doc")) return "📘";
    if (type.includes("excel") || type.includes("sheet") || type.includes("xls")) return "📗";
    if (type.includes("powerpoint") || type.includes("ppt")) return "📙";
    if (type.includes("image") || type.includes("png") || type.includes("jpg")) return "🖼️";
    if (type.includes("video") || type.includes("mp4")) return "🎬";
    if (type.includes("audio") || type.includes("mp3")) return "🎵";
    if (type.includes("zip") || type.includes("rar")) return "📦";
    return "📄";
  };

  // =========================
  // 1) When course selected -> fetch instructors
  // GET /student/courses/:courseId/instructors (AUTH)
  // returns: { status:'success', data:[{staffId,name,email,role,department}] }
  // =========================
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
        if (!token) {
          console.warn("Token missing - cannot fetch instructors");
          setInstructors([]);
          return;
        }

        setLoadingInstructors(true);

        const res = await fetch(
          `${API_BASE_URL}/student/courses/${selectedCourseId}/instructors`,
          { method: "GET", headers: authHeaders }
        );

        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || "Failed to fetch instructors");

        const data = Array.isArray(json.data) ? json.data : [];
        setInstructors(data);

        // reset downstream selections
        setSelectedStaffId("");
        setOfficeHours([]);
        setSelectedSlotId(null);
        setRequestedTime("");
      } catch (e) {
        console.error("fetchInstructors error:", e);
        setInstructors([]);
        setSelectedStaffId("");
        setOfficeHours([]);
        setSelectedSlotId(null);
        setRequestedTime("");
      } finally {
        setLoadingInstructors(false);
      }
    };

    fetchInstructors();
  }, [selectedCourseId, token, authHeaders]);

  // =========================
  // 2) When instructor selected -> fetch office hours
  // GET /student/staff/:staffId/office-hours (AUTH)
  // returns: { status:'success', data:[{id,day,startTime,endTime,location}] }
  // =========================
  useEffect(() => {
    const fetchOfficeHours = async () => {
      const staffIdNum = parseInt(selectedStaffId, 10);
      if (!Number.isFinite(staffIdNum) || staffIdNum <= 0) {
        setOfficeHours([]);
        setSelectedSlotId(null);
        setRequestedTime("");
        return;
      }

      try {
        if (!token) {
          console.warn("Token missing - cannot fetch office hours");
          setOfficeHours([]);
          return;
        }

        setLoadingHours(true);

        const res = await fetch(
          `${API_BASE_URL}/student/staff/${staffIdNum}/office-hours`,
          { method: "GET", headers: authHeaders }
        );

        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || "Failed to fetch office hours");

        const data = Array.isArray(json.data) ? json.data : [];
        setOfficeHours(data);

        // reset chosen slot when changing doctor
        setSelectedSlotId(null);
        setRequestedTime("");
      } catch (e) {
        console.error("fetchOfficeHours error:", e);
        setOfficeHours([]);
        setSelectedSlotId(null);
        setRequestedTime("");
      } finally {
        setLoadingHours(false);
      }
    };

    fetchOfficeHours();
  }, [selectedStaffId, token, authHeaders]);

  // =========================
  // 3) Fetch student's meeting requests (reminders)
  // GET /student/meeting-requests (AUTH)
  // =========================
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        if (!token) return;

        setLoadingMeetings(true);

        const res = await fetch(`${API_BASE_URL}/student/meeting-requests`, {
          method: "GET",
          headers: authHeaders,
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || "Failed to fetch meeting requests");

        const data = Array.isArray(json.data) ? json.data : [];
        setMeetings(data);
      } catch (e) {
        console.error("fetchMeetings error:", e);
        setMeetings([]);
      } finally {
        setLoadingMeetings(false);
      }
    };

    fetchMeetings();
  }, [token, authHeaders]);

  // =========================
  // Slot click:
  // - if date selected -> allow only matching weekday
  // - if date not selected -> auto-set date to NEXT occurrence of that slot day
  // =========================
  const handlePickSlot = (slot) => {
    const slotDow = dayNameToIndex(slot.day);

    // If user selected a date, enforce weekday match
    if (selectedDateDow !== null && slotDow !== null && slotDow !== selectedDateDow) {
      return; // disabled slot should not do anything
    }

    // If date is empty, auto fill with next occurrence date of this slot day
    if (!requestedDate) {
      const next = nextDateForDay(slot.day, null);
      if (next) setRequestedDate(next);
    }

    setSelectedSlotId(slot.id);
    setRequestedTime(slot.startTime); // keep backend format
  };

  // if user changes the date, clear chosen slot if it no longer matches
  useEffect(() => {
    if (!requestedDate || !selectedSlotId) return;

    const chosen = officeHours.find((x) => x.id === selectedSlotId);
    if (!chosen) return;

    const slotDow = dayNameToIndex(chosen.day);
    if (selectedDateDow !== null && slotDow !== null && slotDow !== selectedDateDow) {
      setSelectedSlotId(null);
      setRequestedTime("");
    }
  }, [requestedDate, selectedDateDow, selectedSlotId, officeHours]);

  // =========================
  // 4) Submit meeting request
  // POST /student/staff/:staffId/meeting-requests (AUTH)
  // body: { reason, requestedDate, requestedTime }
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const staffIdNum = parseInt(selectedStaffId, 10);

    if (!selectedCourseId) return alert("Select a course first.");
    if (!Number.isFinite(staffIdNum) || staffIdNum <= 0)
      return alert("Select a valid instructor first.");

    if (!requestedDate) return alert("Pick date.");
    if (!requestedTime) return alert("Pick a time slot from the list (Step 3).");
    if (!reason.trim()) return alert("Reason is required.");
    if (!token) return alert("Token missing. Please log in again.");

    try {
      setSubmitting(true);

      const payload = {
        reason: reason.trim(),
        requestedDate,
        requestedTime,
      };

      const res = await fetch(
        `${API_BASE_URL}/student/staff/${staffIdNum}/meeting-requests`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json.message || "Failed to submit request");
        return;
      }

      alert("✅ Meeting request submitted!");

      // refresh reminders
      const res2 = await fetch(`${API_BASE_URL}/student/meeting-requests`, {
        method: "GET",
        headers: authHeaders,
      });
      const json2 = await res2.json().catch(() => ({}));
      if (res2.ok) {
        const data2 = Array.isArray(json2.data) ? json2.data : [];
        setMeetings(data2);
      }

      // clear fields
      setRequestedDate("");
      setRequestedTime("");
      setSelectedSlotId(null);
      setReason("");
    } catch (e2) {
      console.error("submit meeting request error:", e2);
      alert("Error submitting request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>📚 My Courses</h1>
        <p>View your enrolled courses, course materials, and instructor information</p>
      </div>

      <div className={styles.pageContent}>
        {/* ===== top features ===== */}
        <div className={styles.section}>
          <h2>Course Curriculum & Access</h2>

          <div className={styles.featureList}>
            <button
              type="button"
              className={styles.feature}
              style={{
                textAlign: "left",
                cursor: "pointer",
                background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
                border: "2px solid #667eea",
                padding: "20px",
                width: "100%",
              }}
              onClick={fetchCourseMaterials}
              title="View Course Materials"
            >
              <h3>📖 Course Materials</h3>
              <p>Access syllabi, lecture notes, and course resources</p>
              <span style={{
                fontSize: "0.8rem",
                color: "#667eea",
                fontWeight: 600,
                marginTop: "8px",
                display: "inline-block"
              }}>
                Click to view all materials →
              </span>
            </button>

            <div className={styles.feature}>
              <h3>👨‍🏫 Course Staff</h3>
              <p>View assigned Doctors and Teaching Assistants</p>
            </div>

            <button
              type="button"
              className={styles.feature}
              style={{
                textAlign: "left",
                cursor: "pointer",
                background: "transparent",
                border: "none",
                padding: 0,
              }}
              onClick={() => navigate("/student/schedule")}
              title="Open Schedule"
            >
              <h3>📅 Schedule</h3>
              <p>View class timing and meeting information</p>
            </button>

            <div className={styles.feature}>
              <h3>⭐ Core vs Electives</h3>
              <p>Distinguish between core and elective courses</p>
            </div>
          </div>
        </div>

        {/* ======= Sequence UI ======= */}
        <div className={styles.section}>
          <h2>Request Office Hours</h2>
          <p style={{ color: "#6b7280" }}>
            Step 1: choose course → Step 2: choose instructor → Step 3: click a time slot (date-aware) → Step 4: submit
          </p>

          {/* Step 1 */}
          <div style={{ marginTop: 12 }}>
            <label style={{ display: "block", marginBottom: 6 }}>1) Select Course</label>
            {loadingCourses ? (
              <p style={{ color: "#6b7280" }}>Loading courses...</p>
            ) : (
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
              >
                <option value="">-- Choose a course --</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.code ? `${c.code} - ` : ""}
                    {c.title || `Course ${c._id}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Step 2 */}
          <div style={{ marginTop: 12, opacity: selectedCourseId ? 1 : 0.6 }}>
            <label style={{ display: "block", marginBottom: 6 }}>2) Select Instructor</label>

            {!selectedCourseId ? (
              <p style={{ color: "#6b7280" }}>Select a course first.</p>
            ) : loadingInstructors ? (
              <p style={{ color: "#6b7280" }}>Loading instructors...</p>
            ) : instructors.length > 0 ? (
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
              >
                <option value="">-- Choose instructor --</option>
                {instructors.map((d) => (
                  <option key={d.staffId} value={d.staffId}>
                    {d.name} (StaffID: {d.staffId})
                  </option>
                ))}
              </select>
            ) : (
              <p style={{ color: "#6b7280" }}>No instructors returned for this course.</p>
            )}
          </div>

          {/* Step 4 moved UP: pick date first (so we can disable slots correctly) */}
          <div style={{ marginTop: 12, opacity: selectedStaffId ? 1 : 0.6 }}>
            <h3 style={{ margin: "0 0 8px" }}>3) Choose Date</h3>
            <input
              type="date"
              value={requestedDate}
              onChange={(e) => setRequestedDate(e.target.value)}
              disabled={!selectedStaffId}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
            />
            <p style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>
              If you don’t pick a date, clicking a slot will auto-fill the next occurrence date.
            </p>
          </div>

          {/* Step 3 clickable slots (date-aware) */}
          <div style={{ marginTop: 12, opacity: selectedStaffId ? 1 : 0.6 }}>
            <h3 style={{ margin: "0 0 8px" }}>
              4) Click a Time Slot{" "}
              {requestedTime ? (
                <span style={{ fontSize: 13, color: "#6b7280" }}>
                  (Selected: {requestedTime})
                </span>
              ) : null}
            </h3>

            {!selectedStaffId ? (
              <p style={{ color: "#6b7280" }}>Select an instructor to load office hours.</p>
            ) : loadingHours ? (
              <p style={{ color: "#6b7280" }}>Loading office hours...</p>
            ) : officeHours.length > 0 ? (
              <div style={{ display: "grid", gap: 8 }}>
                {officeHours.map((h) => {
                  const isSelected = selectedSlotId === h.id;

                  const slotDow = dayNameToIndex(h.day);
                  const matchesSelectedDate =
                    selectedDateDow === null || (slotDow !== null && slotDow === selectedDateDow);

                  // label date:
                  // - if requestedDate exists and matches: show requestedDate
                  // - else show next occurrence from today (or from requestedDate if you want)
                  const labelDate = requestedDate && matchesSelectedDate
                    ? requestedDate
                    : nextDateForDay(h.day, null);

                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => handlePickSlot(h)}
                      disabled={!matchesSelectedDate}
                      style={{
                        border: isSelected ? "2px solid #111827" : "1px solid #e5e7eb",
                        borderRadius: 12,
                        padding: 10,
                        background: !matchesSelectedDate ? "#f9fafb" : isSelected ? "#f3f4f6" : "white",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        cursor: !matchesSelectedDate ? "not-allowed" : "pointer",
                        textAlign: "left",
                        opacity: !matchesSelectedDate ? 0.6 : 1,
                      }}
                      title={
                        !matchesSelectedDate
                          ? "This slot does not match the selected date"
                          : "Click to select this time slot"
                      }
                    >
                      <div>
                        <b>{h.day}</b> • {h.startTime} - {h.endTime}
                        <div style={{ color: "#6b7280", marginTop: 4 }}>📍 {h.location}</div>
                        <div style={{ color: "#6b7280", marginTop: 4, fontSize: 12 }}>
                          {requestedDate && matchesSelectedDate
                            ? `Selected date: ${labelDate}`
                            : `Next ${h.day}: ${labelDate}`}
                        </div>
                      </div>

                      <span style={{ color: isSelected ? "#111827" : "#6b7280", fontWeight: isSelected ? 800 : 400 }}>
                        {!matchesSelectedDate ? "Unavailable" : isSelected ? "SELECTED" : "Available"}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: "#6b7280" }}>No office hours found for this instructor.</p>
            )}
          </div>

          {/* Submit */}
          <form onSubmit={handleSubmit} style={{ marginTop: 14, opacity: selectedStaffId ? 1 : 0.6 }}>
            <h3 style={{ margin: "0 0 8px" }}>5) Submit Request</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6 }}>Date</label>
                <input
                  value={requestedDate || "Pick date or click slot"}
                  readOnly
                  disabled
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    background: "#f9fafb",
                    color: requestedDate ? "#111827" : "#6b7280",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6 }}>Time (from slot)</label>
                <input
                  value={requestedTime || "Click a slot above"}
                  readOnly
                  disabled
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    background: "#f9fafb",
                    color: requestedTime ? "#111827" : "#6b7280",
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ display: "block", marginBottom: 6 }}>Reason</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Assignment 2 questions"
                required
                disabled={!selectedStaffId}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
              />
            </div>

            <div style={{ marginTop: 12 }}>
              <button
                type="submit"
                disabled={submitting || !selectedStaffId}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "none",
                  cursor: submitting ? "not-allowed" : "pointer",
                  background: "#111827",
                  color: "white",
                  fontWeight: 600,
                  opacity: submitting || !selectedStaffId ? 0.7 : 1,
                }}
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>

        {/* ===== Reminders ===== */}
        <div className={styles.section}>
          <h2>Meeting Reminders</h2>
          <p style={{ color: "#6b7280" }}>Approved meetings will appear here.</p>

          {loadingMeetings ? (
            <p style={{ color: "#6b7280" }}>Loading meetings...</p>
          ) : approvedMeetings.length > 0 ? (
            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
              {approvedMeetings.map((m) => {
                const dt = new Date(`${m.requestedDate}T${m.requestedTime}`);
                const dateStr = dt.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const timeStr = dt.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={m.id}
                    style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, background: "white" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <h3 style={{ margin: 0 }}>Meeting Approved</h3>
                        <p style={{ margin: "6px 0", color: "#6b7280" }}>Reason: {m.reason || "—"}</p>
                        <p style={{ margin: 0 }}>
                          🗓 {dateStr} • 🕒 {timeStr}
                        </p>
                      </div>

                      <div
                        style={{
                          alignSelf: "flex-start",
                          padding: "6px 10px",
                          borderRadius: 999,
                          background: "#d1fae5",
                          color: "#065f46",
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        APPROVED
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "#6b7280", marginTop: 12 }}>No approved meetings yet.</p>
          )}
        </div>
      </div>

      {/* ===== Course Materials Modal ===== */}
      {showMaterialsModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={() => setShowMaterialsModal(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "900px",
              maxHeight: "85vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                padding: "24px 30px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "1.5rem" }}>📖 Course Materials</h2>
                <p style={{ margin: "8px 0 0", opacity: 0.9, fontSize: "0.95rem" }}>
                  Access all materials from your enrolled courses
                </p>
              </div>
              <button
                onClick={() => setShowMaterialsModal(false)}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  color: "white",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ flex: 1, overflow: "auto", padding: "24px 30px" }}>
              {loadingMaterials ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "16px" }}>⏳</div>
                  <p style={{ color: "#6b7280", fontSize: "1.1rem" }}>Loading course materials...</p>
                </div>
              ) : courseMaterials.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <div style={{ fontSize: "4rem", marginBottom: "16px" }}>📚</div>
                  <h3 style={{ margin: "0 0 10px", color: "#374151" }}>No Materials Available</h3>
                  <p style={{ color: "#6b7280", margin: 0 }}>
                    Your instructors haven't uploaded any materials yet.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Summary Stats */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                      gap: "12px",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        background: "#f3f4f6",
                        padding: "16px",
                        borderRadius: "12px",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#667eea" }}>
                        {courseMaterials.length}
                      </div>
                      <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>Courses</div>
                    </div>
                    <div
                      style={{
                        background: "#f3f4f6",
                        padding: "16px",
                        borderRadius: "12px",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#764ba2" }}>
                        {courseMaterials.reduce((sum, c) => sum + c.resourceCount, 0)}
                      </div>
                      <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>Total Resources</div>
                    </div>
                  </div>

                  {/* Course Accordion */}
                  {courseMaterials.map((course) => (
                    <div
                      key={course.courseId}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        overflow: "hidden",
                      }}
                    >
                      {/* Course Header */}
                      <button
                        onClick={() => toggleCourseExpand(course.courseId)}
                        style={{
                          width: "100%",
                          padding: "18px 20px",
                          background: expandedCourses[course.courseId]
                            ? "linear-gradient(135deg, #667eea10 0%, #764ba210 100%)"
                            : "#fafafa",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          textAlign: "left",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#1f2937" }}>
                            {course.code && <span style={{ color: "#667eea" }}>{course.code}</span>}
                            {course.code && " — "}
                            {course.title}
                          </div>
                          <div style={{ color: "#6b7280", fontSize: "0.9rem", marginTop: "4px" }}>
                            {course.department && `${course.department} • `}
                            {course.resourceCount} {course.resourceCount === 1 ? "resource" : "resources"}
                          </div>
                        </div>
                        <div
                          style={{
                            background: "#667eea",
                            color: "white",
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.2rem",
                            transition: "transform 0.2s ease",
                            transform: expandedCourses[course.courseId] ? "rotate(180deg)" : "rotate(0deg)",
                          }}
                        >
                          ▼
                        </div>
                      </button>

                      {/* Course Resources */}
                      {expandedCourses[course.courseId] && (
                        <div style={{ padding: "16px 20px", background: "white" }}>
                          {course.resources.length === 0 ? (
                            <p style={{ color: "#9ca3af", textAlign: "center", margin: 0 }}>
                              No resources available for this course yet.
                            </p>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                              {course.resources.map((resource) => (
                                <div
                                  key={resource.resourceId}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "14px",
                                    padding: "14px 16px",
                                    background: "#f9fafb",
                                    borderRadius: "10px",
                                    border: "1px solid #e5e7eb",
                                  }}
                                >
                                  <div style={{ fontSize: "2rem" }}>{getFileIcon(resource.fileType)}</div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontWeight: 600,
                                        color: "#1f2937",
                                        marginBottom: "4px",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      {resource.title}
                                    </div>
                                    {resource.description && (
                                      <div
                                        style={{
                                          color: "#6b7280",
                                          fontSize: "0.85rem",
                                          marginBottom: "4px",
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {resource.description}
                                      </div>
                                    )}
                                    <div style={{ color: "#9ca3af", fontSize: "0.8rem" }}>
                                      {formatFileSize(resource.fileSize)}
                                      {resource.uploadDate &&
                                        ` • ${new Date(resource.uploadDate).toLocaleDateString()}`}
                                    </div>
                                  </div>
                                  <a
                                    href={`http://localhost:5000${resource.filePath}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                      color: "white",
                                      padding: "10px 18px",
                                      borderRadius: "8px",
                                      textDecoration: "none",
                                      fontSize: "0.9rem",
                                      fontWeight: 600,
                                      whiteSpace: "nowrap",
                                      transition: "opacity 0.2s ease",
                                    }}
                                    onMouseOver={(e) => (e.target.style.opacity = "0.9")}
                                    onMouseOut={(e) => (e.target.style.opacity = "1")}
                                  >
                                    ↓ Download
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
