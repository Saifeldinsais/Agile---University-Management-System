import { Link } from "react-router-dom";
import "../assets/Home.css";

function Home() {
  return (
    <div className="home-container">

      <section className="hero-box">
        <h1 className="hero-title">Welcome to UMS</h1>
        <p className="hero-subtitle">
          University Management System – Manage your academic journey with ease.
        </p>

        <Link to="/login" className="hero-btn">
          Login as Student
        </Link>
      </section>

      <section className="about-section">
        <h2>About Us</h2>
        <p>
          The University Management System (UMS) is designed to simplify academic 
          life by enabling students to access their course information, enroll or 
          drop classes, explore campus facilities, and track performance – all in 
          one place.  
        </p>
        <p>
          Our goal is to create an efficient, user-friendly system that enhances 
          communication, improves academic transparency, and supports students in 
          achieving their educational goals.
        </p>
      </section>

      <section className="quick-links">
        <h2>Quick Links</h2>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/facilities">Facilities</Link></li>
          <li><Link to="/login">Student Login</Link></li>
        </ul>
      </section>

    </div>
  );
}

export default Home;
