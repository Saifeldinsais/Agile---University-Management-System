import { NavLink } from "react-router-dom";

function NavBarLogged() {
  const linkClass = ({ isActive }) =>
    isActive ? "nav-link nav-link-active" : "nav-link";

  return (
    <header className="navbar">
      <NavLink to="/student/dashboard" className="navbar-logo">
        UMS
      </NavLink>
      <nav className="navbar-links">
        <NavLink to="/student/dashboard" end className={linkClass}>
          Dashboard
        </NavLink>
        <NavLink to="/student/courses" className={linkClass}>
          Courses
        </NavLink>
        <NavLink to="/student/assessments" className={linkClass}>
          Assessments
        </NavLink>
        <NavLink to="/student/announcements" className={linkClass}>
          Announcements
        </NavLink>
        <NavLink to="/student/staff-communication" className={linkClass}>
          Messages
        </NavLink>
        <NavLink to="/student/meeting-requests" className={linkClass}>
          Meetings
        </NavLink>
        <NavLink to="/student/facilities" className={linkClass}>
          Facilities
        </NavLink>
      </nav>
      <div className="navbar-actions">

        <NavLink to="/" className={linkClass}>
          Log Out
        </NavLink>

      </div>
    </header>
  );
}

export default NavBarLogged;
