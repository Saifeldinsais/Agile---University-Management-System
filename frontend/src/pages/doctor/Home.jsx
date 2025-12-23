import { Link } from "react-router-dom";
import styles from "./DoctorHome.module.css";

function DoctorHome() {
  return (
    <div className={styles.page}>
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>Doctor Dashboard</h1>
          <span className={styles.badge}>Doctor / Teacher Portal</span>
        </div>

        <p className={styles.subtitle}>
          Welcome back. Use the shortcuts below to manage your courses, students, and grades.
        </p>
      </div>

      <div className={styles.grid}>
        <Link to="/doctor/courses" className={styles.card}>
          <div className={styles.cardTitle}>My Courses</div>
          <div className={styles.cardText}>View assigned courses, manage assignments and attachments.</div>
          <div className={styles.cardFooter}>Open</div>
        </Link>

        <Link to="/doctor/students" className={styles.card}>
          <div className={styles.cardTitle}>My Students</div>
          <div className={styles.cardText}>Browse students in your courses and track progress.</div>
          <div className={styles.cardFooter}>Open</div>
        </Link>

        <Link to="/doctor/grades" className={styles.card}>
          <div className={styles.cardTitle}>Grade Management</div>
          <div className={styles.cardText}>Enter grades, update marks, and review submissions.</div>
          <div className={styles.cardFooter}>Open</div>
        </Link>
      </div>
    </div>
  );
}

export default DoctorHome;
