import { NavLink } from "react-router-dom";

function NavBarDoctor() {
  const linkClass = ({ isActive }) =>
    isActive ? "nav-link nav-link-active" : "nav-link";

  return (
    <header className="navbar">
      <NavLink to="/doctor/" className="navbar-logo">
        UMS
      </NavLink>
      <nav className="navbar-links">
        <NavLink to="/doctor/" end className={linkClass}>
          Home
        </NavLink>
        <NavLink to="/doctor/facilities" className={linkClass}>
          Facilities
        </NavLink>
        <NavLink to="/doctor/dashboard" className={linkClass}>
          Dashboard
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

export default NavBarDoctor;
