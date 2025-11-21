import styles from "./WelcomeBox.module.css";

function WelcomeBox({ studentName = "Student" , grade , level}) {
    return (
        <div className={styles.welcomeBox}>
      <div className={styles.left}>
        <h2 className={styles.title}>Welcome back, {studentName}! 👋</h2>
        <p className={styles.subtitle}>
          Here’s your academic overview for this semester.
        </p>
      </div>

      <div className={styles.right}>
        <div className={styles.infoItem}>
          <span className={styles.label}>Grade:</span>
          <span className={styles.value}>{grade}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.label}>Level:</span>
          <span className={styles.value}>{level}</span>
        </div>
      </div>
    </div>
    );
}

export default WelcomeBox;
