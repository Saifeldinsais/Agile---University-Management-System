import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../services/apiClient";
import { API_BASE_URL } from "../../services/config";
import "./dashboard.css";
import TimeSlotModal from "../../components/TimeSlotModal";

const COLORS = ["#e11d48", "#2563eb", "#16a34a", "#f97316", "#7c3aed"];

function getColorForDoctor(email) {
  if (!email) return "#6b7280";
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash + email.charCodeAt(i) * 7) % 1000;
  }
  return COLORS[hash % COLORS.length];
}

function WeeklyScheduleGrid({ classrooms, dayFilter, doctorFilter }) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

  return (
    <div className="panel" style={{ marginTop: 24 }}>
      <h3>Weekly Schedule</h3>
      <table className="activity-table">
        <thead>
          <tr>
            <th>Room</th>
            {days.map((d) => (
              <th key={d}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {classrooms.map((room) => (
            <tr key={room._id}>
              <td>{room.roomName}</td>
              {days.map((d) => {
                const slotsForDay = (room.timeSlots || []).filter((slot) => {
                  if (slot.day !== d) return false;
                  if (dayFilter && dayFilter !== "All" && slot.day !== dayFilter)
                    return false;
                  if (
                    doctorFilter &&
                    !slot.doctorEmail
                      .toLowerCase()
                      .includes(doctorFilter.toLowerCase())
                  )
                    return false;
                  return true;
                });

                return (
                  <td key={d}>
                    {slotsForDay.map((slot) => (
                      <div
                        key={slot._id}
                        style={{
                          marginBottom: 4,
                          padding: "2px 6px",
                          borderRadius: 999,
                          fontSize: 11,
                          color: "white",
                          background: getColorForDoctor(slot.doctorEmail),
                        }}
                      >
                        {slot.start}–{slot.end} · {slot.doctorEmail}
                      </div>
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminFacilities() {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [roomName, setRoomName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [type, setType] = useState("hall");

  const [dayFilter, setDayFilter] = useState("All");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [searchRoom, setSearchRoom] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); 
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);

  async function loadClassrooms() {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/admin/classrooms");
      // your controller returns { status, results, data: [...] }
      setClassrooms(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load classrooms");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    console.log("API_BASE_URL", API_BASE_URL);
    loadClassrooms();
  }, []);

  async function handleCreateClassroom(e) {
    e.preventDefault();
    setError("");

    if (!roomName.trim() || !capacity) {
      setError("Room name and capacity are required.");
      return;
    }

    const capNum = Number(capacity);
    if (Number.isNaN(capNum)) {
      setError("Capacity must be a number.");
      return;
    }

    try {
      const res = await apiClient.post("/admin/classrooms", {
        roomName: roomName.trim(),
        capacity: capNum,
        type,
      });
      const newRoom = res.data.data.classroom;
      setClassrooms((prev) => [...prev, newRoom]);
      setRoomName("");
      setCapacity("");
      setType("hall");
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to create classroom."
      );
    }
  }

  async function handleDeleteClassroom(id) {
    if (!window.confirm("Delete this classroom and all its time slots?")) return;

    try {
      await apiClient.delete(`/admin/classrooms/${id}`);
      setClassrooms((prev) => prev.filter((room) => room._id !== id));
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to delete classroom."
      );
    }
  }

  async function handleDeleteSlot(roomId, slotId) {
    if (!window.confirm("Delete this time slot?")) return;
    setError("");

    try {
      await apiClient.delete(`/admin/classrooms/${roomId}/timeslots/${slotId}`);
      await loadClassrooms();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to delete time slot."
      );
    }
  }

  const filteredClassrooms = classrooms
    .filter((room) => {
      if (!searchRoom.trim()) return true;
      return room.roomName
        .toLowerCase()
        .includes(searchRoom.toLowerCase().trim());
    })
    .map((room) => {
      if (dayFilter === "All" && !doctorFilter) return room;
      const filteredSlots = (room.timeSlots || []).filter((slot) => {
        if (dayFilter !== "All" && slot.day !== dayFilter) return false;
        if (
          doctorFilter &&
          !slot.doctorEmail
            .toLowerCase()
            .includes(doctorFilter.toLowerCase())
        )
          return false;
        return true;
      });
      return { ...room, timeSlots: filteredSlots };
    });

  const totalRooms = classrooms.length;
  const hallsCount = classrooms.filter((r) => r.type === "hall").length;
  const labsCount = classrooms.filter((r) => r.type === "lab").length;
  const totalCapacity = classrooms.reduce(
    (sum, r) => sum + (r.capacity || 0),
    0
  );

  return (
    <div className="admin-page">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <h2 className="admin-logo">U-Manage</h2>
        <nav className="admin-menu">
          <button
            className="menu-item"
            onClick={() => navigate("/admin/dashboard")}
          >
            Dashboard
          </button>
          <button
            className="menu-item active"
            onClick={() => navigate("/admin/facilities")}
          >
            Facilities
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/curriculum")}>
            Curriculum
          </button>

          <button className="menu-item">Staff</button>
          <button className="menu-item">Community</button>
        </nav>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Facilities Management</h1>
            <p className="subtitle">
              Manage classrooms, time slots, and doctor schedules.
            </p>
            {loading && <p>Loading classrooms…</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
          </div>

          <div className="header-right">
            <input
              type="search"
              placeholder="Search room (e.g., CS01)…"
              className="search-input"
              value={searchRoom}
              onChange={(e) => setSearchRoom(e.target.value)}
            />
            <div className="admin-user">
              <div className="avatar">A</div>
              <div>
                <p className="user-name">Admin</p>
                <p className="user-role">System Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* cards */}
        <section className="cards-grid">
          <div className="card">
            <p className="card-label">Total Classrooms</p>
            <h2 className="card-value">{totalRooms}</h2>
            <p className="card-sub">All halls & labs</p>
          </div>
          <div className="card">
            <p className="card-label">Halls</p>
            <h2 className="card-value">{hallsCount}</h2>
            <p className="card-sub">Lecture rooms</p>
          </div>
          <div className="card">
            <p className="card-label">Labs</p>
            <h2 className="card-value">{labsCount}</h2>
            <p className="card-sub">Lab facilities</p>
          </div>
          <div className="card">
            <p className="card-label">Total Capacity</p>
            <h2 className="card-value">{totalCapacity}</h2>
            <p className="card-sub">Seats available</p>
          </div>
        </section>

        {/* filters + form + list */}
        <section className="bottom-grid">
          {/* Left: create classroom + filters */}
          <div className="panel">
            <h3>Add Classroom</h3>
            <form onSubmit={handleCreateClassroom}>
              <div style={{ marginBottom: 10 }}>
                <label>Room Name</label>
                <input
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="CS01"
                  maxLength={4}
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 6,
                    border: "1px solid #d1d5db",
                  }}
                />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label>Capacity</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="40"
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 6,
                    border: "1px solid #d1d5db",
                  }}
                />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label>Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 6,
                    border: "1px solid #d1d5db",
                  }}
                >
                  <option value="hall">Hall</option>
                  <option value="lab">Lab</option>
                </select>
              </div>

              <button
                type="submit"
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: "#2563eb",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Create Classroom
              </button>
            </form>

            <hr style={{ margin: "16px 0" }} />

            <h3>Filter Schedule</h3>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <select
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value)}
                style={{ padding: 6, borderRadius: 6, border: "1px solid #d1d5db" }}
              >
                <option value="All">All Days</option>
                <option value="Sunday">Sunday</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
              </select>

              <input
                type="text"
                placeholder="Filter by doctor email"
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                style={{
                  flex: 1,
                  padding: 6,
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                }}
              />
            </div>
          </div>

          {/* Right: classrooms & slots */}
          <div className="panel">
            <h3>Classrooms & Time Slots</h3>

            {filteredClassrooms.length === 0 && !loading && (
              <p>No classrooms match your filters.</p>
            )}

            {filteredClassrooms.length > 0 && (
              <table className="activity-table">
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Type</th>
                    <th>Capacity</th>
                    <th>Slots</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClassrooms.map((room) => (
                    <tr key={room._id}>
                      <td>{room.roomName}</td>
                      <td>{room.type}</td>
                      <td>{room.capacity}</td>
                      <td>
                        {(room.timeSlots || []).length === 0 && (
                          <span style={{ fontSize: 12, color: "#6b7280" }}>
                            No slots
                          </span>
                        )}
                        {(room.timeSlots || []).map((slot) => (
                          <div
                            key={slot._id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 4,
                              padding: "2px 4px",
                              borderRadius: 4,
                              background: "#f3f4f6",
                              fontSize: 12,
                            }}
                          >
                            <span>
                              {slot.day} {slot.start}–{slot.end} ·{" "}
                              <span
                                style={{
                                  color: getColorForDoctor(slot.doctorEmail),
                                  fontWeight: 600,
                                }}
                              >
                                {slot.doctorEmail}
                              </span>
                            </span>
                            <span>
                              <button
                                style={{
                                  marginRight: 4,
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  border: "none",
                                  fontSize: 11,
                                  cursor: "pointer",
                                  background: "#2563eb",
                                  color: "white",
                                }}
                                onClick={() => {
                                  setActiveRoomId(room._id);
                                  setEditingSlot(slot);
                                  setModalMode("edit");
                                  setModalOpen(true);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                style={{
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  border: "none",
                                  fontSize: 11,
                                  cursor: "pointer",
                                  background: "#dc2626",
                                  color: "white",
                                }}
                                onClick={() =>
                                  handleDeleteSlot(room._id, slot._id)
                                }
                              >
                                Delete
                              </button>
                            </span>
                          </div>
                        ))}
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            setActiveRoomId(room._id);
                            setEditingSlot(null);
                            setModalMode("add");
                            setModalOpen(true);
                          }}
                          style={{
                            display: "block",
                            marginBottom: 6,
                            padding: "4px 8px",
                            borderRadius: 4,
                            border: "none",
                            cursor: "pointer",
                            background: "#16a34a",
                            color: "white",
                            fontSize: 12,
                          }}
                        >
                          + Add Slot
                        </button>
                        <button
                          onClick={() => handleDeleteClassroom(room._id)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 4,
                            border: "none",
                            cursor: "pointer",
                            background: "#dc2626",
                            color: "white",
                            fontSize: 12,
                          }}
                        >
                          Delete Room
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Weekly grid */}
        <WeeklyScheduleGrid
          classrooms={classrooms}
          dayFilter={dayFilter}
          doctorFilter={doctorFilter}
        />
      </main>

      {modalOpen && activeRoomId && (
        <TimeSlotModal
          mode={modalMode}
          roomId={activeRoomId}
          slot={editingSlot}
          onClose={() => setModalOpen(false)}
          onSaved={loadClassrooms}
        />
      )}
    </div>
  );
}

export default AdminFacilities;
