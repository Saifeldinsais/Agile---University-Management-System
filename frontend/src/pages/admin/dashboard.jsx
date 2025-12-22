import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../services/apiClient";
import "./dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalClassrooms: 0,
    halls: 0,
    labs: 0,
    totalTimeSlots: 0,
    totalCapacity: 0,
    totalCourses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        // Facilities + courses
        const [roomsRes, coursesRes] = await Promise.all([
          apiClient.get("/admin/classrooms"),
          apiClient.get("/student/viewCourses"),
        ]);

        // Backend response: { data: { classrooms: [...] } }
        const classrooms = roomsRes.data?.data?.classrooms || roomsRes.data?.classrooms || [];

        const courses = Array.isArray(coursesRes.data)
          ? coursesRes.data
          : [];

        const totalClassrooms = classrooms.length;
        const halls = classrooms.filter((r) => r.type === "hall").length;
        const labs = classrooms.filter((r) => r.type === "lab").length;
        const totalTimeSlots = classrooms.reduce(
          (sum, r) => sum + ((r.timeSlots && r.timeSlots.length) || 0),
          0
        );
        const totalCapacity = classrooms.reduce(
          (sum, r) => sum + (parseInt(r.capacity) || 0),
          0
        );
        const totalCourses = courses.length;

        setStats({
          totalClassrooms,
          halls,
          labs,
          totalTimeSlots,
          totalCapacity,
          totalCourses,
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data. Is backend running?");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function go(path) {
    navigate(path);
  }

  return (
    <div className="admin-page">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <h2 className="admin-logo">U-Manage</h2>
        <nav className="admin-menu">
          <button
            className="menu-item active"
            onClick={() => go("/admin/dashboard")}
          >
            Dashboard
          </button>
          <button
            className="menu-item"
            onClick={() => go("/admin/facilities")}
          >
            Facilities
          </button>
          <button className="menu-item" onClick={() => go("/admin/curriculum")}>
            Curriculum
          </button>

          <button className="menu-item" onClick={() => alert("Staff soon")}> 
            Staff
          </button>
          <button className="menu-item" onClick={() => go("/admin/enrollments")}>
            Enrollments
          </button>
          <button className="menu-item" onClick={() => alert("Community soon")}> 
            Community
          </button>
        </nav>

        {/* Logout button */}
        <div style={{ marginTop: "auto", padding: "20px" }}>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              localStorage.removeItem("student");
              go("/login");
            }}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 8,
              border: "none",
              background: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontWeight: 500,
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => e.target.style.background = "rgba(239, 68, 68, 0.2)"}
            onMouseOut={(e) => e.target.style.background = "rgba(239, 68, 68, 0.1)"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="subtitle">
              Live overview of classrooms, time slots and courses.
            </p>
            {error && (
              <p style={{ color: "red", marginTop: 4, fontSize: 13 }}>{error}</p>
            )}
          </div>

          <div className="header-right">
            {/* <input
              type="search"
              placeholder="Search…"
              className="search-input"
            /> */}
            <div className="admin-user">
              <div className="avatar">A</div>
              <div>
                <p className="user-name">Admin</p>
                <p className="user-role">System Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Cards with REAL data */}
        <section className="cards-grid">
          <div className="card">
            <p className="card-label">Total Classrooms</p>
            <h2 className="card-value">
              {loading ? "…" : stats.totalClassrooms}
            </h2>
            <p className="card-sub">All registered rooms</p>
          </div>

          <div className="card">
            <p className="card-label">Halls</p>
            <h2 className="card-value">{loading ? "…" : stats.halls}</h2>
            <p className="card-sub">mesh 3aref akteb eh hena</p>
          </div>

          <div className="card">
            <p className="card-label">Labs</p>
            <h2 className="card-value">{loading ? "…" : stats.labs}</h2>
            <p className="card-sub">w hena bardo</p>
          </div>

          <div className="card">
            <p className="card-label">Time Slots</p>
            <h2 className="card-value">
              {loading ? "…" : stats.totalTimeSlots}
            </h2>
            <p className="card-sub">Total scheduled slots</p>
          </div>
        </section>

        {/* Bottom section */}
        <section className="bottom-grid">
          <div className="panel">
            <h3>Quick Actions</h3>
            <div className="quick-actions">
              <button
                className="quick-btn"
                onClick={() => go("/admin/facilities")}
              >
                + Add Classroom
              </button>
              <button
                className="quick-btn"
                onClick={() => go("/admin/facilities")}
              >
                + Add Time Slot
              </button>
              <button
                className="quick-btn"
                onClick={() => alert("Staff module coming soon")}
              >
                + Add Staff
              </button>
              <button
                className="quick-btn"
                onClick={() => alert("Announcements coming soon")}
              >
                + Announcement
              </button>
            </div>
          </div>

          <div className="panel">
            <h3>Summary</h3>
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total classrooms</td>
                  <td>{loading ? "…" : stats.totalClassrooms}</td>
                </tr>
                <tr>
                  <td>Halls / Labs</td>
                  <td>
                    {loading
                      ? "…"
                      : `${stats.halls} halls · ${stats.labs} labs`}
                  </td>
                </tr>
                <tr>
                  <td>Total time slots</td>
                  <td>{loading ? "…" : stats.totalTimeSlots}</td>
                </tr>
                <tr>
                  <td>Total Student Capacity</td>
                  <td>{loading ? "…" : stats.totalCapacity}</td>
                </tr>
                <tr>
                  <td>Total courses</td>
                  <td>{loading ? "…" : stats.totalCourses}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
