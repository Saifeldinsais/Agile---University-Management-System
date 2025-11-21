import styles from "./EnrolledCourse.module.css";

function EnrolledCourse({ course, status, grade , onDrop}) {
  return (
        <div className={styles.card}>
        <h2 className={styles.title}>{course.title}</h2>

        <p><strong>Code:</strong> {course.code}</p>

        <p><strong>Credits:</strong> {course.credits}</p>

        <p><strong>Department:</strong> {course.department}</p>

        <p>
            <strong>Status:</strong>{" "}
            <span className={styles.status}>{status}</span>
        </p>

        <p>
            <strong>Grade:</strong>{" "}
            {grade !== null ? grade : "Not graded yet"}
        </p>

        {(status === "enrolled" || status === "pending") && (
        <button className={styles.dropBtn} onClick={onDrop}>
          Drop Course
        </button>
      )}
        

        </div>
  );
}

export default EnrolledCourse;
