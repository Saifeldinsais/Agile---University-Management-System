import { NavLink } from "react-router-dom";

function NavBarLogged() {
  const linkClass = ({ isActive }) =>
    isActive ? "nav-link nav-link-active" : "nav-link";

  return (
    <header className="navbar">
      <NavLink to="/student/" className="navbar-logo">
        UMS
      </NavLink>
      <nav className="navbar-links">
        <NavLink to="/student/" end className={linkClass}>
          Home
        </NavLink>
        <NavLink to="/student/facilities" className={linkClass}>
          Facilities
        </NavLink>
        <NavLink to="/student/dashboard" className={linkClass}>
          Dashboard
        </NavLink>
        <NavLink to="/student/electives" className={linkClass}>
          Select Electives
        </NavLink>
        <NavLink to="/student/timetable" className={linkClass}>
          Timetable
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
