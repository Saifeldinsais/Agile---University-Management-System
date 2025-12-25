import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import styles from "./DoctorMainLayout.module.css";

function DoctorMainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sideNavOpen, setSideNavOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const doctor = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdvisor = doctor.role === "advisor" || doctor.isAdvisor;

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊", path: "/doctor/dashboard" },
    { id: "courses", label: "Courses", icon: "📚", path: "/doctor/courses" },
    { id: "assessments", label: "Assessments", icon: "📋", path: "/doctor/assessments" },
    { id: "grading", label: "Grading", icon: "✏️", path: "/doctor/grading" },
    { id: "students", label: "Students", icon: "👥", path: "/doctor/students" },
    { id: "student-messages", label: "Student Messages", icon: "💬", path: "/doctor/student-messages" },
    { id: "meeting-management", label: "Meeting Requests", icon: "📅", path: "/doctor/meeting-management" },
    { id: "office-hours", label: "Office Hours", icon: "🕐", path: "/doctor/office-hours" },
    { id: "announcements", label: "Announcements", icon: "📢", path: "/doctor/announcements" },
    ...(isAdvisor ? [{ id: "advisor", label: "Advisor", icon: "👨‍🎓", path: "/doctor/advisor" }] : []),
    { id: "profile", label: "Profile", icon: "👤", path: "/doctor/profile" },
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
            ☰
          </button>
          <div className={styles.logo}>UMS Doctor Portal</div>
        </div>

        <div className={styles.topBarRight}>
          {/* Notifications */}
          <button className={styles.topBarIcon} title="Notifications">
            🔔
            <span className={styles.notificationBadge}>3</span>
          </button>

          {/* Messages */}
          <button className={styles.topBarIcon} title="Messages">
            ✉️
            <span className={styles.messageBadge}>2</span>
          </button>

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
              <span className={styles.dropdown}>▼</span>
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
                  👤 View Profile
                </button>
                <div className={styles.dropdownDivider}></div>
                <button
                  className={styles.dropdownItem}
                  onClick={handleLogout}
                >
                  🚪 Logout
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
