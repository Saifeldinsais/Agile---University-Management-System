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
    // Percentage check (if grade > 5, assume percentage scale)
    if (grade > 5) {
      if (grade >= 90) return "#27ae60";
      if (grade >= 80) return "#3498db";
      if (grade >= 70) return "#f59e0b";
      if (grade >= 60) return "#ef4444";
      return "#6b7280";
    }
    // GPA scale (0-4.0)
    if (grade >= 4.0) return "#27ae60"; // A
    if (grade >= 3.7) return "#27ae60"; // A-
    if (grade >= 3.3) return "#3498db"; // B+
    if (grade >= 3.0) return "#3498db"; // B
    if (grade >= 2.7) return "#3498db"; // B-
    if (grade >= 2.0) return "#f59e0b"; // C+, C, C-
    if (grade >= 1.0) return "#ef4444"; // D+, D, D-
    return "#6b7280"; // F
  };

  const getGradeLabel = (grade) => {
    // Percentage check
    if (grade > 5) {
      if (grade >= 90) return "A";
      if (grade >= 80) return "B";
      if (grade >= 70) return "C";
      if (grade >= 60) return "D";
      return "F";
    }
    // GPA scale - standard 4.0 scale (A+ is stored separately in letterGrade)
    if (grade >= 4.0) return "A";   // A+ and A = 4.0
    if (grade >= 3.7) return "A-";  // 3.7
    if (grade >= 3.3) return "B+";  // 3.3
    if (grade >= 3.0) return "B";   // 3.0
    if (grade >= 2.7) return "B-";  // 2.7
    if (grade >= 2.3) return "C+";  // 2.3
    if (grade >= 2.0) return "C";   // 2.0
    if (grade >= 1.7) return "C-";  // 1.7
    if (grade >= 1.3) return "D+";  // 1.3
    if (grade >= 1.0) return "D";   // 1.0
    if (grade >= 0.7) return "D-";  // 0.7
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
          {completedCourses.map((course) => {
            // Use stored letterGrade if available, otherwise calculate from GPA
            const displayGrade = course.letterGrade || getGradeLabel(course.finalGrade);
            const gradeColorValue = course.letterGrade
              ? (course.letterGrade.startsWith('A') ? '#22c55e' : course.letterGrade.startsWith('B') ? '#3b82f6' : course.letterGrade.startsWith('C') ? '#f59e0b' : course.letterGrade.startsWith('D') ? '#ef4444' : '#6b7280')
              : getGradeColor(course.finalGrade);

            return (
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
                    {course.completionDate && (
                      <span className={styles.detail}>
                        <strong>Completed:</strong>{" "}
                        {new Date(course.completionDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.gradeSection}>
                  <div
                    className={styles.gradeCircle}
                    style={{
                      borderColor: gradeColorValue,
                    }}
                  >
                    <div
                      className={styles.gradeLabel}
                      style={{ color: gradeColorValue }}
                    >
                      {displayGrade}
                    </div>
                  </div>
                  <div className={styles.gradeInfo}>
                    <span className={styles.gradeValue}>
                      {course.finalGrade.toFixed(2)}
                    </span>
                    <span className={styles.gradeStatus}>
                      {course.status || course.completionStatus}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CompletedCourses;
