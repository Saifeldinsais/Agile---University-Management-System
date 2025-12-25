import { useNavigate, useLocation } from "react-router-dom";

/**
 * Shared Admin Sidebar Component
 * Displays consistent navigation across all admin pages
 */
function AdminSidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { path: "/admin/dashboard", label: "Dashboard", icon: "📊" },
        { path: "/admin/facilities", label: "Facilities", icon: "🏫" },
        { path: "/admin/curriculum", label: "Curriculum", icon: "📚" },
        { path: "/admin/staff/directory", label: "Staff Directory", icon: "👥" },
        { path: "/admin/staff/assignments", label: "Course Assignments", icon: "📝" },
        { path: "/admin/enrollments", label: "Enrollments", icon: "🎓" },
        { path: "/admin/announcements", label: "Announcements", icon: "📢" },
        { path: "/admin/events", label: "Events", icon: "📅" },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="admin-sidebar">
            <h2 className="admin-logo">U-Manage</h2>
            <nav className="admin-menu">
                {menuItems.map(item => (
                    <button
                        key={item.path}
                        className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                        <span style={{ marginRight: '8px' }}>{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </nav>

            <div style={{ marginTop: "auto", padding: "20px" }}>
                <button
                    onClick={() => {
                        localStorage.removeItem("token");
                        localStorage.removeItem("user");
                        localStorage.removeItem("student");
                        navigate("/login");
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
                    🚪 Logout
                </button>
            </div>
        </aside>
    );
}

export default AdminSidebar;
