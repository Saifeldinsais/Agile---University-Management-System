import { useNavigate, useLocation } from "react-router-dom";

function AdminSidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { path: "/admin/dashboard", label: "Dashboard" },
        { path: "/admin/facilities", label: "Facilities" },
        { path: "/admin/curriculum", label: "Curriculum" },
        { path: "/admin/staff/directory", label: "Staff Directory" },
        { path: "/admin/staff/assignments", label: "Assignments" },
        { path: "/admin/enrollments", label: "Enrollments" },
        { path: "/admin/announcements", label: "Announcements" },
        { path: "/admin/events", label: "Events" },
    ];

    const isActive = (path) => location.pathname === path;

    const styles = {
        sidebar: {
            width: 240,
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
            padding: '28px 16px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '4px 0 24px rgba(0, 0, 0, 0.1)',
        },
        logoSection: {
            marginBottom: 32,
            paddingLeft: 12,
        },
        logo: {
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '-0.02em',
            margin: 0,
        },
        logoSubtext: {
            fontSize: '0.6875rem',
            color: '#64748b',
            marginTop: 4,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
        },
        nav: {
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            flex: 1,
        },
        menuItem: {
            display: 'flex',
            alignItems: 'center',
            padding: '12px 14px',
            borderRadius: 8,
            fontSize: '0.875rem',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            textAlign: 'left',
            width: '100%',
        },
        menuItemDefault: {
            background: 'transparent',
            color: '#94a3b8',
        },
        menuItemHover: {
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#e2e8f0',
        },
        menuItemActive: {
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
        },
        divider: {
            height: 1,
            background: 'rgba(255, 255, 255, 0.06)',
            margin: '16px 0',
        },
        footer: {
            marginTop: 'auto',
            paddingTop: 16,
        },
        logoutBtn: {
            width: '100%',
            padding: '12px 14px',
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'transparent',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
            transition: 'all 0.15s ease',
            textAlign: 'left',
        },
        userSection: {
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px',
            marginBottom: 16,
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 10,
        },
        userAvatar: {
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.875rem',
        },
        userName: {
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#f1f5f9',
            margin: 0,
        },
        userRole: {
            fontSize: '0.75rem',
            color: '#64748b',
            margin: 0,
        },
    };

    return (
        <aside style={styles.sidebar}>
            {/* Logo */}
            <div style={styles.logoSection}>
                <h2 style={styles.logo}>UniManage</h2>
                <p style={styles.logoSubtext}>Admin Portal</p>
            </div>

            {/* User Info */}
            <div style={styles.userSection}>
                <div style={styles.userAvatar}>A</div>
                <div>
                    <p style={styles.userName}>Admin</p>
                    <p style={styles.userRole}>System Administrator</p>
                </div>
            </div>

            <div style={styles.divider} />

            {/* Navigation */}
            <nav style={styles.nav}>
                {menuItems.map(item => (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        style={{
                            ...styles.menuItem,
                            ...(isActive(item.path) ? styles.menuItemActive : styles.menuItemDefault),
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive(item.path)) {
                                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                e.target.style.color = '#e2e8f0';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive(item.path)) {
                                e.target.style.background = 'transparent';
                                e.target.style.color = '#94a3b8';
                            }
                        }}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>

            {/* Footer */}
            <div style={styles.footer}>
                <div style={styles.divider} />
                <button
                    onClick={() => {
                        localStorage.removeItem("token");
                        localStorage.removeItem("user");
                        localStorage.removeItem("student");
                        navigate("/login");
                    }}
                    style={styles.logoutBtn}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                        e.target.style.color = '#f87171';
                        e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                        e.target.style.color = '#64748b';
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                >
                    Sign Out
                </button>
            </div>
        </aside>
    );
}

export default AdminSidebar;
