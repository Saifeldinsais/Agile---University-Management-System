import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./ParentLayout.css";

function ParentLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const navItems = [
        { path: "/parent/dashboard", icon: "🏠", label: "Dashboard" },
        { path: "/parent/students", icon: "👨‍🎓", label: "My Students" },
        { path: "/parent/messages", icon: "💬", label: "Messages" },
        { path: "/parent/announcements", icon: "📢", label: "Announcements" },
        { path: "/parent/profile", icon: "👤", label: "Profile" },
    ];

    return (
        <div className="parent-layout">
            {/* Sidebar */}
            <aside className={`parent-sidebar ${isSidebarOpen ? "open" : "closed"}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <span className="logo-icon">👨‍👩‍👧‍👦</span>
                        {isSidebarOpen && <span className="logo-text">Parent Portal</span>}
                    </div>
                    <button
                        className="sidebar-toggle"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        {isSidebarOpen ? "◀" : "▶"}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `nav-item ${isActive ? "active" : ""}`
                            }
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {isSidebarOpen && <span className="nav-label">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">
                            {user.full_name?.charAt(0) || "P"}
                        </div>
                        {isSidebarOpen && (
                            <div className="user-details">
                                <span className="user-name">{user.full_name || "Parent"}</span>
                                <span className="user-role">Parent</span>
                            </div>
                        )}
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        {isSidebarOpen ? "Logout" : "🚪"}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="parent-main">
                <header className="parent-header">
                    <h1>Parent-Teacher Portal</h1>
                    <div className="header-actions">
                        <span className="welcome-text">
                            Welcome, {user.full_name || "Parent"}
                        </span>
                    </div>
                </header>
                <div className="parent-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default ParentLayout;
