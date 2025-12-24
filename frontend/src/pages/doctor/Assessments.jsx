import { useState, useEffect } from "react";
import styles from "./Assessments.module.css";

function DoctorAssessments() {
  const [assessments, setAssessments] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [courses, setCourses] = useState([
    { id: 1, code: "CS101", title: "Intro to Programming" },
    { id: 2, code: "CS102", title: "Data Structures" },
  ]);
  const [formData, setFormData] = useState({
    title: "",
    courseId: "",
    type: "assignment",
    deadline: "",
    totalPoints: 100,
  });

  useEffect(() => {
    // Mock assessments data
    setAssessments([]);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateAssessment = (e) => {
    e.preventDefault();
    const newAssessment = {
      id: assessments.length + 1,
      ...formData,
      status: "draft",
      submissions: 0,
      graded: 0,
    };
    setAssessments([...assessments, newAssessment]);
    setShowCreateForm(false);
    setFormData({
      title: "",
      courseId: "",
      type: "assignment",
      deadline: "",
      totalPoints: 100,
    });
  };

  const handlePublish = (id) => {
    setAssessments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "published" } : a))
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Assessments & Assignments</h1>
        <button
          className={styles.createBtn}
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? "Cancel" : "+ Create Assessment"}
        </button>
      </div>

      {showCreateForm && (
        <form className={styles.form} onSubmit={handleCreateAssessment}>
          <div className={styles.formGroup}>
            <label>Assessment Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Midterm Exam"
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Course</label>
              <select
                name="courseId"
                value={formData.courseId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select course...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}: {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
              >
                <option value="assignment">Assignment</option>
                <option value="quiz">Quiz</option>
                <option value="exam">Exam</option>
                <option value="project">Project</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Deadline</label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Total Points</label>
              <input
                type="number"
                name="totalPoints"
                value={formData.totalPoints}
                onChange={handleInputChange}
                min="1"
                max="1000"
              />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn}>
            Create Assessment
          </button>
        </form>
      )}

      <div className={styles.assessmentsList}>
        {assessments.length === 0 ? (
          <p className={styles.empty}>No assessments created yet</p>
        ) : (
          assessments.map((assessment) => (
            <div key={assessment.id} className={styles.assessmentCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h3>{assessment.title}</h3>
                  <p className={styles.course}>{assessment.course}</p>
                </div>
                <span className={`${styles.badge} ${styles[assessment.status]}`}>
                  {assessment.status}
                </span>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.detail}>
                  <span className={styles.label}>Type:</span>
                  <span>{assessment.type}</span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.label}>Deadline:</span>
                  <span>{assessment.deadline}</span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.label}>Total Points:</span>
                  <span>{assessment.totalPoints}</span>
                </div>
              </div>

              <div className={styles.stats}>
                <div className={styles.stat}>
                  <div className={styles.statNumber}>{assessment.submissions}</div>
                  <div className={styles.statLabel}>Submissions</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statNumber}>{assessment.graded}</div>
                  <div className={styles.statLabel}>Graded</div>
                </div>
              </div>

              <div className={styles.actions}>
                <button className={styles.actionBtn}>Edit</button>
                {assessment.status === "draft" && (
                  <button
                    className={`${styles.actionBtn} ${styles.publish}`}
                    onClick={() => handlePublish(assessment.id)}
                  >
                    Publish
                  </button>
                )}
                <button className={styles.actionBtn}>View Submissions</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DoctorAssessments;
