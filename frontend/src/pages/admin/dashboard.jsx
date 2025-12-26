import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../services/apiClient";
import AdminSidebar from "../../components/AdminSidebar";
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
  const [parentRequests, setParentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchParentRequests = async () => {
    try {
      const response = await apiClient.get("/admin/parent-requests");
      setParentRequests(response.data.data || []);
    } catch (err) {
      console.error("Failed to load parent requests:", err);
    }
  };

  const handleApproveRequest = async (linkId) => {
    try {
      await apiClient.patch(`/admin/parent-requests/${linkId}/approve`);
      setParentRequests(parentRequests.filter(r => r.link_id !== linkId));
    } catch (err) {
      alert("Failed to approve: " + (err.response?.data?.message || err.message));
    }
  };

  const handleRejectRequest = async (linkId) => {
    try {
      await apiClient.patch(`/admin/parent-requests/${linkId}/reject`);
      setParentRequests(parentRequests.filter(r => r.link_id !== linkId));
    } catch (err) {
      alert("Failed to reject: " + (err.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        // Facilities + courses + parent requests
        const [roomsRes, coursesRes] = await Promise.all([
          apiClient.get("/admin/classrooms"),
          apiClient.get("/student/viewCourses"),
        ]);

        // Fetch parent requests separately (non-blocking)
        fetchParentRequests();

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
      <AdminSidebar />

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
            <p className="card-sub">Lecture halls</p>
          </div>

          <div className="card">
            <p className="card-label">Labs</p>
            <h2 className="card-value">{loading ? "…" : stats.labs}</h2>
            <p className="card-sub">Computer labs</p>
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
                onClick={() => go("/admin/staff/directory")}
              >
                + Add Staff
              </button>
              <button
                className="quick-btn"
                onClick={() => go("/admin/announcements")}
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

        {/* Parent Link Requests Section */}
        <section className="parent-requests-section">
          <div className="panel full-width">
            <h3>
              🔗 Parent Link Requests
              {parentRequests.length > 0 && (
                <span className="badge">{parentRequests.length}</span>
              )}
            </h3>
            {parentRequests.length === 0 ? (
              <p className="no-requests">No pending parent-student link requests</p>
            ) : (
              <div className="requests-list">
                {parentRequests.map((req) => (
                  <div key={req.link_id} className="request-item">
                    <div className="request-info">
                      <div className="request-users">
                        <span className="parent-name">👤 {req.parent_name}</span>
                        <span className="arrow">→</span>
                        <span className="student-name">🎓 {req.student_name}</span>
                      </div>
                      <div className="request-details">
                        <span className="relationship">{req.relationship}</span>
                        <span className="email">{req.parent_email}</span>
                      </div>
                    </div>
                    <div className="request-actions">
                      <button
                        className="approve-btn"
                        onClick={() => handleApproveRequest(req.link_id)}
                      >
                        ✓ Approve
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => handleRejectRequest(req.link_id)}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
