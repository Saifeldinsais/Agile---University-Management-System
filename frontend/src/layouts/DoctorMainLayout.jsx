import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import styles from "./DoctorMainLayout.module.css";

// Clean SVG Icons - No Emojis
const Icons = {
  menu: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  ),
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  courses: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  assessments: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  grading: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  students: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  messages: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  meetings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  officeHours: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  announcements: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  advisor: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  ),
  profile: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  logout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  chevronDown: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
};

function DoctorMainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sideNavOpen, setSideNavOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const doctor = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdvisor = doctor.role === "advisor" || doctor.isAdvisor;

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: Icons.dashboard, path: "/doctor/dashboard" },
    { id: "courses", label: "Courses", icon: Icons.courses, path: "/doctor/courses" },
    { id: "assessments", label: "Assessments", icon: Icons.assessments, path: "/doctor/assessments" },
    { id: "grading", label: "Grading", icon: Icons.grading, path: "/doctor/grading" },
    { id: "students", label: "Students", icon: Icons.students, path: "/doctor/students" },
    { id: "student-messages", label: "Messages", icon: Icons.messages, path: "/doctor/student-messages" },
    { id: "meeting-management", label: "Meetings", icon: Icons.meetings, path: "/doctor/meeting-management" },
    { id: "office-hours", label: "Office Hours", icon: Icons.officeHours, path: "/doctor/office-hours" },
    { id: "announcements", label: "Announcements", icon: Icons.announcements, path: "/doctor/announcements" },
    ...(isAdvisor ? [{ id: "advisor", label: "Advisor", icon: Icons.advisor, path: "/doctor/advisor" }] : []),
    { id: "profile", label: "Profile", icon: Icons.profile, path: "/doctor/profile" },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    navigate("/login");
  };

  return (
    <div className={styles.layoutContainer}>
      {/* Top Bar */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <button
            className={styles.toggleButton}
            onClick={() => setSideNavOpen(!sideNavOpen)}
            title="Toggle sidebar"
          >
            {Icons.menu}
          </button>
          <div className={styles.logo}>Faculty Portal</div>
        </div>

        <div className={styles.topBarRight}>
          {/* Profile Menu */}
          <div className={styles.profileMenu}>
            <button
              className={styles.profileButton}
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            >
              <div className={styles.profileAvatar}>
                {doctor.fullName?.charAt(0) || "D"}
              </div>
              <span className={styles.profileName}>{doctor.fullName || "Doctor"}</span>
              <span className={styles.dropdown}>{Icons.chevronDown}</span>
            </button>

            {profileMenuOpen && (
              <div className={styles.profileDropdown}>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    navigate("/doctor/profile");
                    setProfileMenuOpen(false);
                  }}
                >
                  {Icons.profile}
                  View Profile
                </button>
                <div className={styles.dropdownDivider}></div>
                <button
                  className={styles.dropdownItem}
                  onClick={handleLogout}
                >
                  {Icons.logout}
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className={styles.mainContainer}>
        {/* Side Navigation */}
        <aside className={`${styles.sideNav} ${sideNavOpen ? styles.open : styles.closed}`}>
          <nav className={styles.navList}>
            {navigationItems.map((item) => (
              <button
                key={item.id}
                className={`${styles.navItem} ${isActive(item.path) ? styles.active : ""}`}
                onClick={() => {
                  navigate(item.path);
                  if (window.innerWidth < 768) setSideNavOpen(false);
                }}
                title={item.label}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {sideNavOpen && <span className={styles.navLabel}>{item.label}</span>}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DoctorMainLayout;
