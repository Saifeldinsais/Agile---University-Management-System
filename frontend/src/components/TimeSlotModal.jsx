import { useEffect, useState } from "react";
import { apiClient } from "../services/apiClient";

function TimeSlotModal({ mode, roomId, slot, onClose, onSaved }) {
  const [day, setDay] = useState(slot?.day || "Sunday");
  const [start, setStart] = useState(slot?.start || "09:00");
  const [end, setEnd] = useState(slot?.end || "10:00");
  const [doctorEmail, setDoctorEmail] = useState(slot?.doctorEmail || "");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!doctorEmail || !day || !start || !end) {
      setError("All fields are required.");
      return;
    }

    const body = { day, start, end, doctorEmail };

    try {
      if (mode === "edit" && slot?._id) {
        await apiClient.patch(
          `/admin/classrooms/${roomId}/timeslots/${slot._id}`,
          body
        );
      } else {
        await apiClient.post(`/admin/classrooms/${roomId}/timeslots`, body);
      }

      onSaved(); // refresh classrooms
      onClose();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to save time slot."
      );
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#ffffff",
          padding: 20,
          borderRadius: 12,
          width: 380,
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
        }}
      >
        <h2 style={{ marginBottom: 12 }}>
          {mode === "edit" ? "Edit Time Slot" : "Add Time Slot"}
        </h2>

        {error && (
          <p style={{ color: "red", marginBottom: 10, fontSize: 14 }}>{error}</p>
        )}

        <form onSubmit={handleSubmit}>
          <label>Day</label>
          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 10 }}
          >
            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"].map(
              (d) => (
                <option key={d}>{d}</option>
              )
            )}
          </select>

          <label>Start Time</label>
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 10 }}
          />

          <label>End Time</label>
          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 10 }}
          />

          <label>Doctor Email</label>
          <input
            type="email"
            value={doctorEmail}
            onChange={(e) => setDoctorEmail(e.target.value)}
            placeholder="doctor@ums-doctor"
            style={{ width: "100%", padding: 8, marginBottom: 10 }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 5,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "6px 12px",
                background: "#9CA3AF",
                border: "none",
                borderRadius: 6,
                color: "white",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "6px 14px",
                background: "#2563EB",
                border: "none",
                borderRadius: 6,
                color: "white",
                cursor: "pointer",
              }}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TimeSlotModal;
