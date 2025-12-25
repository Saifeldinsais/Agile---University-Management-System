import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../services/config";
import styles from "./CompletedCourses.module.css";

function CompletedCourses({ studentId }) {
  const [completedCourses, setCompletedCourses] = useState([]);
  const [gpa, setGpa] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompletedCourses = async () => {
      if (!studentId) return;

      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/student/completed-courses/${studentId}`
        );
        if (!response.ok) throw new Error("Failed to fetch completed courses");

        const data = await response.json();
        setCompletedCourses(data.completedCourses || []);
        setGpa(data.gpa || 0);
        setTotalCredits(data.totalCredits || 0);
        setError(null);
      } catch (err) {
        console.error("Error fetching completed courses:", err);
        setError(err.message);
        setCompletedCourses([]);
        setGpa(0);
        setTotalCredits(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedCourses();
  }, [studentId]);

  const getGradeColor = (grade) => {
    if (grade >= 90) return "#27ae60"; // Green - A
    if (grade >= 80) return "#3498db"; // Blue - B
    if (grade >= 70) return "#f39c12"; // Orange - C
    if (grade >= 60) return "#e74c3c"; // Red - D
    return "#95a5a6"; // Gray - F
  };

  const getGradeLabel = (grade) => {
    if (grade >= 90) return "A";
    if (grade >= 80) return "B";
    if (grade >= 70) return "C";
    if (grade >= 60) return "D";
    return "F";
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingMessage}>Loading completed courses...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Completed Courses</h2>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.label}>GPA</span>
            <span className={styles.value}>{gpa.toFixed(2)}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.label}>Total Credits</span>
            <span className={styles.value}>{totalCredits}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.label}>Courses Completed</span>
            <span className={styles.value}>{completedCourses.length}</span>
          </div>
        </div>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      {completedCourses.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No completed courses yet.</p>
          <p className={styles.subtitle}>
            Complete your enrolled courses to see them here.
          </p>
        </div>
      ) : (
        <div className={styles.coursesList}>
          {completedCourses.map((course) => (
            <div key={course.enrollmentId} className={styles.courseCard}>
              <div className={styles.courseInfo}>
                <div className={styles.courseHeader}>
                  <h3 className={styles.courseTitle}>{course.title}</h3>
                  <span className={styles.courseCode}>{course.code}</span>
                </div>
                <p className={styles.department}>{course.department}</p>
                <div className={styles.courseDetails}>
                  <span className={styles.detail}>
                    <strong>Credits:</strong> {course.credits}
                  </span>
                  <span className={styles.detail}>
                    <strong>Completed:</strong>{" "}
                    {new Date(course.completionDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className={styles.gradeSection}>
                <div
                  className={styles.gradeCircle}
                  style={{
                    borderColor: getGradeColor(course.finalGrade),
                  }}
                >
                  <div
                    className={styles.gradeLabel}
                    style={{ color: getGradeColor(course.finalGrade) }}
                  >
                    {getGradeLabel(course.finalGrade)}
                  </div>
                </div>
                <div className={styles.gradeInfo}>
                  <span className={styles.gradeValue}>
                    {course.finalGrade.toFixed(2)}
                  </span>
                  <span className={styles.gradeStatus}>
                    {course.completionStatus}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CompletedCourses;
