import { NavLink } from "react-router-dom";

function Navbar() {
  const linkClass = ({ isActive }) =>
    isActive ? "nav-link nav-link-active" : "nav-link";

  return (
    <header className="navbar">
      <div className="navbar-logo">UMS</div>
      <nav className="navbar-links">
        <NavLink to="/" className={linkClass}>
          Home
        </NavLink>
        <NavLink to="/facilities" className={linkClass}>
          Facilities
        </NavLink>
        <NavLink to="/dashboard" className={linkClass}>
          Dashboard
        </NavLink>
      </nav>
      <div className="navbar-actions">
        <NavLink to="/signup" className={linkClass}>
          Sign Up
        </NavLink>

        <NavLink to="/login" className={linkClass}>
          Login
        </NavLink>

      </div>
    </header>
  );
}

export default Navbar;
