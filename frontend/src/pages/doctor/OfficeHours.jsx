import { useEffect, useMemo, useState } from "react";
import styles from "./OfficeHours.module.css";

function DoctorOfficeHours() {
  const token = useMemo(() => localStorage.getItem("token"), []);
  const baseURL = "http://localhost:5000";

  const [doctorEntityId, setDoctorEntityId] = useState(null);

  const [officeHours, setOfficeHours] = useState([]);
  const [meetingRequests, setMeetingRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddHours, setShowAddHours] = useState(false);

  // form
  const [newHours, setNewHours] = useState({
    day: "Monday",
    startTime: "",
    endTime: "",
    location: "",
  });

  // ---------------- helpers ----------------
  const authHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

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

  // ======== time utils + validation ========
  const timeToMinutes = (t) => {
    if (!t || typeof t !== "string") return NaN;
    const [hh, mm] = t.split(":").map(Number);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return NaN;
    return hh * 60 + mm;
  };

  const overlaps = (aStart, aEnd, bStart, bEnd) => {
    // [aStart, aEnd) overlaps [bStart, bEnd)
    return aStart < bEnd && bStart < aEnd;
  };

  const validateOfficeHour = ({ day, startTime, endTime, location }) => {
    if (!day || !startTime || !endTime || !location) {
      return "Please fill day, start time, end time, and location.";
    }

    const s = timeToMinutes(startTime);
    const e = timeToMinutes(endTime);
    if (!Number.isFinite(s) || !Number.isFinite(e)) return "Invalid time format.";

    // 1) end must be after start
    if (e <= s) return "End time must be after start time.";

    // 2) min duration (30 min)
    const MIN_DURATION_MIN = 30;
    if (e - s < MIN_DURATION_MIN) {
      return `Office hour must be at least ${MIN_DURATION_MIN} minutes.`;
    }

    // 3) optional: allowed working window
    const MIN_ALLOWED = timeToMinutes("08:00");
    const MAX_ALLOWED = timeToMinutes("20:00");
    if (s < MIN_ALLOWED || e > MAX_ALLOWED) {
      return "Office hours must be between 08:00 and 20:00.";
    }

    // 4) no overlap with existing office hours for same day
    const sameDay = officeHours.filter((h) => String(h.day) === String(day));
    for (const h of sameDay) {
      const hs = timeToMinutes(h.startTime);
      const he = timeToMinutes(h.endTime);
      if (Number.isFinite(hs) && Number.isFinite(he) && overlaps(s, e, hs, he)) {
        return `This time overlaps with existing office hours (${h.startTime} - ${h.endTime}).`;
      }
    }

    return null; // valid
  };

  // ---------------- API ----------------
  const apiMe = async () => {
    const res = await fetch(`${baseURL}/api/auth/me`, { headers: authHeaders() });
    const json = await safeJson(res);
    if (!res.ok) throw new Error(json?.message || "Failed to load current user");
    const id = json?.user?.id ?? json?.user?.data?.id ?? json?.id ?? null;
    if (!id) throw new Error("doctorEntityId not found in /auth/me");
    return id;
  };

  // GET /api/doctor/office-hours/me
  const apiGetOfficeHours = async () => {
    const res = await fetch(`${baseURL}/api/doctor/office-hours/me`, {
      headers: authHeaders(),
    });
    const json = await safeJson(res);
    if (!res.ok) throw new Error(json?.message || "Failed to load office hours");
    return json?.data || [];
  };

  // POST /api/doctor/office-hours
  const apiCreateOfficeHour = async (payload) => {
    const res = await fetch(`${baseURL}/api/doctor/office-hours`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await safeJson(res);
    if (!res.ok) throw new Error(json?.message || "Failed to create office hour");
    return json?.data;
  };

  // GET /api/doctor/meeting-requests
  const apiGetMeetingRequests = async () => {
    const res = await fetch(`${baseURL}/api/doctor/meeting-requests`, {
      headers: authHeaders(),
    });
    const json = await safeJson(res);
    if (!res.ok) throw new Error(json?.message || "Failed to load meeting requests");
    return json?.data || [];
  };

  // PUT /api/doctor/meeting-requests/:id/approve
  const apiApproveMeeting = async (id) => {
    const res = await fetch(`${baseURL}/api/doctor/meeting-requests/${id}/approve`, {
      method: "PUT",
      headers: jsonHeaders(),
      body: JSON.stringify({}),
    });
    const json = await safeJson(res);
    if (!res.ok) throw new Error(json?.message || "Failed to approve meeting");
    return true;
  };

  // PUT /api/doctor/meeting-requests/:id/reject
  const apiRejectMeeting = async (id) => {
    const res = await fetch(`${baseURL}/api/doctor/meeting-requests/${id}/reject`, {
      method: "PUT",
      headers: jsonHeaders(),
      body: JSON.stringify({}),
    });
    const json = await safeJson(res);
    if (!res.ok) throw new Error(json?.message || "Failed to reject meeting");
    return true;
  };

  // ---------------- load page ----------------
  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError("");

        const id = await apiMe();
        setDoctorEntityId(id);

        const [hours, requests] = await Promise.all([
          apiGetOfficeHours(),
          apiGetMeetingRequests(),
        ]);

        setOfficeHours(hours);
        setMeetingRequests(requests);
      } catch (e) {
        console.error(e);
        setError(e.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ---------------- actions ----------------
  const handleAddOfficeHours = async () => {
    try {
      if (!doctorEntityId) throw new Error("doctorEntityId missing");

      const validationError = validateOfficeHour(newHours);
      if (validationError) {
        alert(validationError);
        return;
      }

      const payload = {
        // NOTE: backend should ignore doctorId and use req.user.id, but keep it if you want
        doctorId: doctorEntityId,
        day: newHours.day,
        startTime: newHours.startTime,
        endTime: newHours.endTime,
        location: newHours.location,
      };

      await apiCreateOfficeHour(payload);

      const hours = await apiGetOfficeHours();
      setOfficeHours(hours);

      setShowAddHours(false);
      setNewHours({ day: "Monday", startTime: "", endTime: "", location: "" });
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to add office hours");
    }
  };

  const handleApproveMeeting = async (id) => {
    try {
      await apiApproveMeeting(id);
      setMeetingRequests((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "approved" } : m))
      );
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to approve");
    }
  };

  const handleRejectMeeting = async (id) => {
    try {
      await apiRejectMeeting(id);
      setMeetingRequests((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "rejected" } : m))
      );
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to reject");
    }
  };

  // ---------------- UI ----------------
  return (
    <div className={styles.container}>
      <h1>Office Hours & Meeting Management</h1>

      {loading && <p className={styles.empty}>Loading...</p>}
      {error && (
        <p className={styles.empty} style={{ color: "red" }}>
          {error}
        </p>
      )}

      <div className={styles.grid}>
        {/* Office Hours */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>My Office Hours</h2>
            <button
              className={styles.addBtn}
              onClick={() => setShowAddHours(!showAddHours)}
              disabled={loading}
            >
              {showAddHours ? "Cancel" : "+ Add Hours"}
            </button>
          </div>

          {showAddHours && (
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label>Day</label>
                <select
                  value={newHours.day}
                  onChange={(e) => setNewHours((p) => ({ ...p, day: e.target.value }))}
                >
                  <option>Monday</option>
                  <option>Tuesday</option>
                  <option>Wednesday</option>
                  <option>Thursday</option>
                  <option>Friday</option>
                  <option>Saturday</option>
                  <option>Sunday</option>
                </select>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={newHours.startTime}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNewHours((p) => {
                        // auto-fix: if endTime exists but now invalid, clear it
                        const s = timeToMinutes(v);
                        const eMin = timeToMinutes(p.endTime);
                        return {
                          ...p,
                          startTime: v,
                          endTime: Number.isFinite(eMin) && Number.isFinite(s) && eMin <= s ? "" : p.endTime,
                        };
                      });
                    }}
                    min="08:00"
                    max="19:30"
                    step="900" // 15 minutes
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>End Time</label>
                  <input
                    type="time"
                    value={newHours.endTime}
                    onChange={(e) => setNewHours((p) => ({ ...p, endTime: e.target.value }))}
                    min={newHours.startTime || "08:30"} // UI constraint
                    max="20:00"
                    step="900"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Location</label>
                <input
                  type="text"
                  placeholder="e.g., Office 301"
                  value={newHours.location}
                  onChange={(e) => setNewHours((p) => ({ ...p, location: e.target.value }))}
                />
              </div>

              <button className={styles.submitBtn} onClick={handleAddOfficeHours}>
                Add Office Hours
              </button>
            </div>
          )}

          <div className={styles.hoursList}>
            {officeHours.length === 0 ? (
              <p className={styles.empty}>No office hours added yet</p>
            ) : (
              officeHours.map((hours) => (
                <div key={hours.id} className={styles.hoursItem}>
                  <div className={styles.day}>{hours.day}</div>
                  <div className={styles.time}>
                    {hours.startTime} - {hours.endTime}
                  </div>
                  <div className={styles.location}>{hours.location}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Meeting Requests */}
        <div className={styles.section}>
          <h2>Meeting Requests</h2>

          <div className={styles.requestsList}>
            {meetingRequests.length === 0 ? (
              <p className={styles.empty}>No meeting requests</p>
            ) : (
              meetingRequests.map((request) => (
                <div
                  key={request.id}
                  className={`${styles.requestItem} ${styles[request.status]}`}
                >
                  <div className={styles.requestInfo}>
                    <h4>{request.studentName}</h4>
                    <p className={styles.reason}>{request.reason}</p>
                    <p className={styles.datetime}>
                      {request.requestedDate} at {request.requestedTime}
                    </p>
                  </div>

                  <div className={styles.requestStatus}>
                    <span className={`${styles.badge} ${styles[request.status]}`}>
                      {request.status}
                    </span>
                  </div>

                  {request.status === "pending" && (
                    <div className={styles.requestActions}>
                      <button
                        className={styles.approveBtn}
                        onClick={() => handleApproveMeeting(request.id)}
                      >
                        Approve
                      </button>
                      <button
                        className={styles.rejectBtn}
                        onClick={() => handleRejectMeeting(request.id)}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className={styles.section}>
          <h2>Upcoming Meetings</h2>

          <div className={styles.meetingsList}>
            {meetingRequests
              .filter((m) => m.status === "approved")
              .map((meeting) => (
                <div key={meeting.id} className={styles.meetingItem}>
                  <div className={styles.meetingDate}>{meeting.requestedDate}</div>
                  <div className={styles.meetingDetails}>
                    <h4>{meeting.studentName}</h4>
                    <p>{meeting.requestedTime}</p>
                  </div>
                </div>
              ))}

            {meetingRequests.filter((m) => m.status === "approved").length === 0 && (
              <p className={styles.empty}>No approved meetings scheduled</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DoctorOfficeHours;
