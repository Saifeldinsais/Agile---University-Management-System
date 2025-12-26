import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

function AdminNavbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const menuItems = [
        { path: "/admin/dashboard", label: "Dashboard" },
        { path: "/admin/facilities", label: "Facilities" },
        { path: "/admin/curriculum", label: "Curriculum" },
        { path: "/admin/staff/directory", label: "Staff" },
        { path: "/admin/staff/assignments", label: "Assignments" },
        { path: "/admin/enrollments", label: "Enrollments" },
        { path: "/admin/announcements", label: "Announcements" },
        { path: "/admin/events", label: "Events" },
    ];

    const isActive = (path) => location.pathname === path;

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("student");
        navigate("/login");
    };

    return (
        <header style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            background: '#fff',
            borderBottom: '1px solid #e5e7eb',
            padding: '0 32px',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: 64,
                maxWidth: 1400,
                margin: '0 auto',
            }}>
                {/* Logo */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 32,
                }}>
                    <div
                        onClick={() => navigate('/admin/dashboard')}
                        style={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                        }}>
                            U
                        </div>
                        <span style={{
                            fontSize: '1.125rem',
                            fontWeight: 600,
                            color: '#111827',
                            letterSpacing: '-0.02em',
                        }}>
                            UniManage
                        </span>
                    </div>

                    {/* Navigation Links */}
                    <nav style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                    }}>
                        {menuItems.map(item => (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: 6,
                                    border: 'none',
                                    background: isActive(item.path) ? '#f3f4f6' : 'transparent',
                                    color: isActive(item.path) ? '#111827' : '#6b7280',
                                    fontSize: '0.875rem',
                                    fontWeight: isActive(item.path) ? 600 : 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive(item.path)) {
                                        e.target.style.background = '#f9fafb';
                                        e.target.style.color = '#374151';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive(item.path)) {
                                        e.target.style.background = 'transparent';
                                        e.target.style.color = '#6b7280';
                                    }
                                }}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* User Menu */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '6px 12px 6px 6px',
                            borderRadius: 8,
                            border: '1px solid #e5e7eb',
                            background: '#fff',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#d1d5db';
                            e.currentTarget.style.background = '#f9fafb';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.background = '#fff';
                        }}
                    >
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '0.8125rem',
                        }}>
                            A
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <p style={{
                                margin: 0,
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                color: '#111827'
                            }}>Admin</p>
                        </div>
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            style={{
                                transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.15s ease',
                            }}
                        >
                            <path d="M4 6L8 10L12 6" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>

                    {/* Dropdown */}
                    {showUserMenu && (
                        <>
                            <div
                                style={{
                                    position: 'fixed',
                                    inset: 0,
                                    zIndex: 10,
                                }}
                                onClick={() => setShowUserMenu(false)}
                            />
                            <div style={{
                                position: 'absolute',
                                right: 0,
                                top: 'calc(100% + 8px)',
                                width: 200,
                                background: '#fff',
                                borderRadius: 10,
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                                padding: 6,
                                zIndex: 20,
                            }}>
                                <div style={{
                                    padding: '12px 14px',
                                    borderBottom: '1px solid #f3f4f6',
                                    marginBottom: 6,
                                }}>
                                    <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: '#111827' }}>Admin</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#6b7280' }}>System Administrator</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: 6,
                                        border: 'none',
                                        background: 'transparent',
                                        color: '#dc2626',
                                        fontSize: '0.8125rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'background 0.15s ease',
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = '#fef2f2'}
                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                >
                                    Sign Out
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

export default AdminNavbar;
