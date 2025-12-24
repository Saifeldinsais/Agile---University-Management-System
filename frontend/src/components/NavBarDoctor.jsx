import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";

function NavBarDoctor() {
  const navigate = useNavigate();
  const linkClass = ({ isActive }) =>
    isActive ? "nav-link nav-link-active" : "nav-link";

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    navigate("/login");
  };

  return (
    <header className="navbar">
      <NavLink to="/doctor/dashboard" className="navbar-logo">
        UMS
      </NavLink>
      <nav className="navbar-links">
        <NavLink to="/doctor/dashboard" end className={linkClass}>
          Dashboard
        </NavLink>
        <NavLink to="/doctor/courses" className={linkClass}>
          Courses
        </NavLink>
        <NavLink to="/doctor/students" className={linkClass}>
          Students
        </NavLink>
        <NavLink to="/doctor/facilities" className={linkClass}>
          Facilities
        </NavLink>
      </nav>
      <div className="navbar-actions">
        <button 
          className="nav-link"
          onClick={handleLogout}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "inherit",
            fontSize: "inherit",
            fontWeight: "inherit"
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default NavBarDoctor;
