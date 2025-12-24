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
            <div className={styles.feature}>
              <h3>📖 Course Materials</h3>
              <p>Access syllabi, lecture notes, and course resources</p>
            </div>

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
    </div>
  );
}

export default Courses;
