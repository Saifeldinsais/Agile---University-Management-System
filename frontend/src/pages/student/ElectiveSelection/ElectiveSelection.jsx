import { useState, useEffect } from "react";
import StudentService from "../../../services/studentService";
import styles from "./ElectiveSelection.module.css";

function ElectiveSelection() {
  const [electives, setElectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedCourses, setSelectedCourses] = useState(new Set());

  useEffect(() => {
    fetchElectives();
  }, []);

  const fetchElectives = async () => {
    try {
      setLoading(true);
      const response = await StudentService.getAvailableElectives();
      setElectives(response.data.electives || []);
      setError("");
    } catch (err) {
      console.error("Error fetching electives:", err);
      if (err.response?.status === 403) {
        setError("Access denied. Only students can view electives.");
      } else {
        setError(err.response?.data?.message || "Failed to load electives");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectElective = async (courseId) => {
    if (selectedCourses.has(courseId)) {
      return;
    }

    try {
      setSuccess("");
      setError("");
      const response = await StudentService.selectElective(courseId);
      setSuccess(response.data.message || "Elective selected successfully!");
      setSelectedCourses(new Set([...selectedCourses, courseId]));
      await fetchElectives();
    } catch (err) {
      console.error("Error selecting elective:", err);
      const errorMsg = err.response?.data?.message || "Failed to select elective";
      setError(errorMsg);
      setSuccess("");
    }
  };

  if (loading) {
    return <div className={styles.container}><p>Loading electives...</p></div>;
  }

  return (
    <div className={styles.container}>
      <h1>Select Elective Courses</h1>
      
      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      {electives.length === 0 ? (
        <p className={styles.empty}>No electives available at this time.</p>
      ) : (
        <div className={styles.electivesGrid}>
          {electives.map((elective) => {
            const isSelected = selectedCourses.has(elective._id);
            const isFull = elective.available_seats <= 0;
            const scheduleText = elective.schedule 
              ? (typeof elective.schedule === 'string' ? elective.schedule : JSON.stringify(elective.schedule))
              : "Schedule TBA";

            return (
              <div key={elective._id} className={styles.electiveCard}>
                <h2 className={styles.title}>{elective.title || "Untitled Course"}</h2>
                <p className={styles.code}>Code: {elective.code || "N/A"}</p>
                
                {elective.description && (
                  <p className={styles.description}>{elective.description}</p>
                )}

                <div className={styles.details}>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Credits:</span>
                    <span className={styles.value}>{elective.credits || 0}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Department:</span>
                    <span className={styles.value}>{elective.department || "N/A"}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Instructor:</span>
                    <span className={styles.value}>{elective.instructor || "TBA"}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Schedule:</span>
                    <span className={styles.value}>{scheduleText}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Capacity:</span>
                    <span className={styles.value}>
                      {elective.enrolled_count || 0} / {elective.capacity || 0}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Available Seats:</span>
                    <span className={styles.value}>{elective.available_seats || 0}</span>
                  </div>
                </div>

                <button
                  className={`${styles.selectBtn} ${isSelected || isFull ? styles.disabled : ""}`}
                  onClick={() => handleSelectElective(elective._id)}
                  disabled={isSelected || isFull}
                >
                  {isSelected ? "Selected" : isFull ? "Full" : "Select Elective"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ElectiveSelection;

