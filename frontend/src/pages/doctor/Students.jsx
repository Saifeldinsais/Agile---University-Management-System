import { useState } from "react";
import styles from "./Students.module.css";

function DoctorStudents() {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses] = useState([
    { id: 1, code: "CS101", title: "Intro to Programming", students: 45 },
    { id: 2, code: "CS102", title: "Data Structures", students: 38 },
  ]);
  const [students] = useState([
    {
      id: 1,
      name: "Ahmed Ali",
      email: "ahmed@uni.edu",
      courseId: 1,
      gpa: 3.8,
      attendance: 92,
      engagement: "High",
    },
    {
      id: 2,
      name: "Fatima Hassan",
      email: "fatima@uni.edu",
      courseId: 1,
      gpa: 3.6,
      attendance: 88,
      engagement: "High",
    },
    {
      id: 3,
      name: "Mohammed Ibrahim",
      email: "mohammed@uni.edu",
      courseId: 2,
      gpa: 3.2,
      attendance: 75,
      engagement: "Medium",
    },
  ]);

  const selectedStudents = selectedCourse
    ? students.filter((s) => s.courseId === selectedCourse.id)
    : students;

  return (
    <div className={styles.container}>
      <h1>Students Monitoring (Read-Only)</h1>
      <p className={styles.note}>
        ℹ️ This section is for monitoring only. Student records cannot be modified here.
      </p>

      <div className={styles.layout}>
        <div className={styles.sidebar}>
          <h3>Courses</h3>
          <div className={styles.courseList}>
            <button
              className={`${styles.courseItem} ${!selectedCourse ? styles.active : ""}`}
              onClick={() => setSelectedCourse(null)}
            >
              All Students
            </button>
            {courses.map((course) => (
              <button
                key={course.id}
                className={`${styles.courseItem} ${selectedCourse?.id === course.id ? styles.active : ""}`}
                onClick={() => setSelectedCourse(course)}
              >
                <span className={styles.code}>{course.code}</span>
                <span className={styles.count}>{course.students}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.header}>
            <h2>
              {selectedCourse
                ? `${selectedCourse.code}: ${selectedCourse.title}`
                : "All Students"}
            </h2>
            <span className={styles.studentCount}>
              {selectedStudents.length} students
            </span>
          </div>

          <div className={styles.studentGrid}>
            {selectedStudents.map((student) => (
              <div key={student.id} className={styles.studentCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.studentName}>{student.name}</div>
                  <span
                    className={`${styles.engagement} ${styles[student.engagement.toLowerCase()]}`}
                  >
                    {student.engagement}
                  </span>
                </div>

                <div className={styles.details}>
                  <div className={styles.detail}>
                    <span className={styles.label}>Email:</span>
                    <span className={styles.value}>{student.email}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.label}>GPA:</span>
                    <span className={styles.value}>{student.gpa}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.label}>Attendance:</span>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progress}
                        style={{ width: `${student.attendance}%` }}
                      ></div>
                    </div>
                    <span className={styles.value}>{student.attendance}%</span>
                  </div>
                </div>

                <div className={styles.action}>
                  <button className={styles.viewBtn} disabled>
                    View Profile (Read-Only)
                  </button>
                </div>
              </div>
            ))}
          </div>

          {selectedStudents.length === 0 && (
            <p className={styles.empty}>No students in this course</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DoctorStudents;
