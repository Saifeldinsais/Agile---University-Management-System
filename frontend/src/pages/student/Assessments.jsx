import { useState, useEffect } from "react";
import styles from "./StudentPages.module.css";

function Assessments() {
  useEffect(() => {
    document.title = 'Assessments & Grades - Performance Tracking';
  }, []);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>📊 Assessments & Grades</h1>
        <p>View your assignments, quizzes, exams, and received grades with feedback</p>
      </div>

      <div className={styles.pageContent}>
        <div className={styles.section}>
          <h2>Assessments & Performance</h2>
          <p style={{ color: '#6b7280' }}>
            Track all course assessments including assignments, quizzes, and exams. 
            View your submission status, grades, and instructor feedback once released.
          </p>
          
          <div className={styles.featureList}>
            <div className={styles.feature}>
              <h3>📝 Assignments</h3>
              <p>View assignment deadlines and submission status</p>
            </div>
            <div className={styles.feature}>
              <h3>✅ Quizzes & Exams</h3>
              <p>Track quiz and exam schedules</p>
            </div>
            <div className={styles.feature}>
              <h3>⭐ Grades</h3>
              <p>View released grades with detailed breakdowns</p>
            </div>
            <div className={styles.feature}>
              <h3>💬 Feedback</h3>
              <p>Read instructor feedback per assessment</p>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Privacy & Access</h2>
          <p style={{ color: '#6b7280' }}>
            All assessments, grades, and feedback are strictly private and visible only to you. 
            No other student can view your grades or feedback.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Features Coming Soon</h2>
          <ul style={{ color: '#6b7280', lineHeight: '1.8' }}>
            <li>✓ View all course assessments</li>
            <li>✓ Track submission deadlines</li>
            <li>✓ Submit assignments</li>
            <li>✓ View released grades</li>
            <li>✓ Read instructor feedback</li>
            <li>✓ Performance analytics and trends</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Assessments;
