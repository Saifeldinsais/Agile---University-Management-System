// src/pages/admin/AdminCurriculum.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../../services/courseService";

const emptyForm = {
  title: "",
  code: "",
  description: "",
  credits: "",
  department: "",
};

function AdminCurriculum() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCourses() {
    try {
      setLoading(true);
      setError("");
      const data = await getCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
        err.message ||
        "Failed to load courses."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.title || !form.code || !form.credits || !form.department) {
      setError("Title, Code, Credits and Department are required.");
      return;
    }

    try {
      setLoading(true);
      if (isEditing && editingId) {
        await updateCourse(editingId, form);
      } else {
        await createCourse(form);
      }

      setForm(emptyForm);
      setIsEditing(false);
      setEditingId(null);
      await loadCourses();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
        err.message ||
        "Failed to save course."
      );
    } finally {
      setLoading(false);
    }
  }

  function startEdit(course) {
    setForm({
      title: course.title || "",
      code: course.code || "",
      description: course.description || "",
      credits: course.credits ? parseInt(course.credits) : "",
      department: course.department || "",
    });
    setIsEditing(true);
    setEditingId(course._id);
  }

  function cancelEdit() {
    setForm(emptyForm);
    setIsEditing(false);
    setEditingId(null);
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this course?")) return;
    setError("");
    try {
      setLoading(true);
      await deleteCourse(id);
      await loadCourses();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
        err.message ||
        "Failed to delete course."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredCourses = courses.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.title?.toLowerCase().includes(q) ||
      c.code?.toLowerCase().includes(q) ||
      c.department?.toLowerCase().includes(q)
    );
  });

  const totalCourses = courses.length;

  return (
    <div className="admin-page">
      {/* Sidebar – same as other admin pages */}
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
            className="menu-item"
            onClick={() => navigate("/admin/facilities")}
          >
            Facilities
          </button>
          <button
            className="menu-item active"
            onClick={() => navigate("/admin/curriculum")}
          >
            Curriculum
          </button>
          <button className="menu-item">Staff</button>
          <button className="menu-item">Community</button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Curriculum Management</h1>
            <p className="subtitle">
              Manage the list of courses available for students.
            </p>
            {loading && <p>Loading courses…</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
          </div>

          <div className="header-right">
            <input
              type="search"
              placeholder="Search by title, code, department…"
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
            <p className="card-label">Total Courses</p>
            <h2 className="card-value">{totalCourses}</h2>
            <p className="card-sub">All curriculum entries</p>
          </div>
          <div className="card">
            <p className="card-label">More metrics</p>
            <p className="card-sub">comming soon</p>
          </div>
          <div className="card">
            <p className="card-label">More metrics</p>
            <p className="card-sub">comming soon</p>
          </div>
          <div className="card">
            <p className="card-label">More metric</p>
            <p className="card-sub">comming soon</p>
          </div>
        </section>

        {/* form + table (bottom-grid is already styled) */}
        <section className="bottom-grid" style={{ marginTop: 18 }}>
          {/* Left: form */}
          <div className="panel">
            <h3>{isEditing ? "Edit Course" : "Add New Course"}</h3>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 10 }}>
                <label>Title</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Software Engineering"
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 6,
                    border: "1px solid #d1d5db",
                  }}
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label>Code</label>
                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="CSE343"
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 6,
                    border: "1px solid #d1d5db",
                  }}
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label>Credits</label>
                <input
                  type="number"
                  name="credits"
                  value={form.credits}
                  onChange={handleChange}
                  min="1"
                  max="6"
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 6,
                    border: "1px solid #d1d5db",
                  }}
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label>Department</label>
                <input
                  type="text"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  placeholder="Computer Engineering"
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 6,
                    border: "1px solid #d1d5db",
                  }}
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label>Description</label>
                <textarea
                  name="description"
                  rows={3}
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Short description of the course"
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 6,
                    border: "1px solid #d1d5db",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 8 }}>
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
                  disabled={loading}
                >
                  {isEditing ? "Save Changes" : "Add Course"}
                </button>

                {isEditing && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "none",
                      background: "#6b7280",
                      color: "white",
                      cursor: "pointer",
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right: table */}
          <div className="panel">
            <h3>Courses List</h3>

            {filteredCourses.length === 0 ? (
              <p>No courses found.</p>
            ) : (
              <table className="activity-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Code</th>
                    <th>Credits</th>
                    <th>Department</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => (
                    <tr key={course._id}>
                      <td>{course.title}</td>
                      <td>{course.code}</td>
                      <td>{parseInt(course.credits)}</td>
                      <td>{course.department}</td>
                      <td>{course.description || "-"}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => startEdit(course)}
                          style={{
                            marginRight: 4,
                            padding: "4px 8px",
                            borderRadius: 4,
                            border: "none",
                            cursor: "pointer",
                            background: "#2563eb",
                            color: "white",
                            fontSize: 12,
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(course._id)}
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
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminCurriculum;
