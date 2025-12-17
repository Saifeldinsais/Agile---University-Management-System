import styles from "./Course.module.css";

function Course({ title, code, description, credits, department, onEnroll }) {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>{title}</h2>

      <p className={styles.code}>Course Code: {code}</p>

      {description && <p className={styles.description}>{description}</p>}

      <div className={styles.infoRow}>
        <span className={styles.credits}>Credits: {parseInt(credits || 0)}</span>
        <span className={styles.department}>{department}</span>
      </div>

      <button
        className={styles.enrollBtn}
        onClick={() => onEnroll(code)}
      >
        Enroll
      </button>

    </div>
  );
}

export default Course;
