import { useState, useEffect } from "react";
import styles from "./StudentPages.module.css";

function Courses() {
  useEffect(() => {
    document.title = 'My Courses - Curriculum & Materials';
  }, []);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>📚 My Courses</h1>
        <p>View your enrolled courses, course materials, and instructor information</p>
      </div>

      <div className={styles.pageContent}>
        <div className={styles.section}>
          <h2>Course Curriculum & Access</h2>
          <p style={{ color: '#6b7280' }}>
            View detailed information about your enrolled courses including syllabus, 
            instructor details, course schedule, and available course materials.
          </p>
          
          <div className={styles.featureList}>
            <div className={styles.feature}>
              <h3>📖 Course Materials</h3>
              <p>Access syllabi, lecture notes, and course resources</p>
            </div>
            <div className={styles.feature}>
              <h3>👨‍🏫 Course Staff</h3>
              <p>View assigned Doctors and Teaching Assistants</p>
            </div>
            <div className={styles.feature}>
              <h3>📅 Schedule</h3>
              <p>View class timing and meeting information</p>
            </div>
            <div className={styles.feature}>
              <h3>⭐ Core vs Electives</h3>
              <p>Distinguish between core and elective courses</p>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Features Coming Soon</h2>
          <ul style={{ color: '#6b7280', lineHeight: '1.8' }}>
            <li>✓ Detailed course information and syllabus</li>
            <li>✓ Instructor profiles and contact information</li>
            <li>✓ Course materials library</li>
            <li>✓ Schedule and meeting times</li>
            <li>✓ Related links and resources</li>
            <li>✓ Course staff directory (read-only)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Courses;
