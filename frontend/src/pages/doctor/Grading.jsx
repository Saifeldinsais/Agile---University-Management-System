import { useState, useEffect } from "react";
import styles from "./Grading.module.css";

function DoctorGrading() {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [view, setView] = useState("list");
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    // Mock submissions data
    setSubmissions([]);
  }, []);

  const pendingSubmissions = submissions.filter((s) => s.status === "submitted");

  const handleViewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade || "");
    setFeedback(submission.feedback || "");
    setView("detail");
  };

  const handleSubmitGrade = () => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === selectedSubmission.id
          ? {
              ...s,
              grade: parseInt(grade),
              feedback,
              status: "graded",
            }
          : s
      )
    );
    setView("list");
    setSelectedSubmission(null);
    setGrade("");
    setFeedback("");
  };

  return (
    <div className={styles.container}>
      <h1>Grading & Evaluation</h1>

      {view === "list" ? (
        <>
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{pendingSubmissions.length}</div>
              <div className={styles.statLabel}>Pending Grading</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{submissions.filter((s) => s.status === "graded").length}</div>
              <div className={styles.statLabel}>Already Graded</div>
            </div>
          </div>

          <div className={styles.submissionsList}>
            <h2>Pending Submissions</h2>
            {pendingSubmissions.length === 0 ? (
              <p className={styles.empty}>All submissions graded!</p>
            ) : (
              pendingSubmissions.map((submission) => (
                <div key={submission.id} className={styles.submissionItem}>
                  <div className={styles.submissionInfo}>
                    <h3>{submission.studentName}</h3>
                    <p className={styles.assignmentName}>
                      {submission.assignmentTitle}
                    </p>
                    <p className={styles.courseCode}>{submission.course}</p>
                    <p className={styles.submittedDate}>
                      Submitted: {submission.submittedDate}
                    </p>
                  </div>
                  <button
                    className={styles.gradeBtn}
                    onClick={() => handleViewSubmission(submission)}
                  >
                    Grade →
                  </button>
                </div>
              ))
            )}
          </div>

          <div className={styles.submissionsList}>
            <h2>Recently Graded</h2>
            {submissions.filter((s) => s.status === "graded").map((submission) => (
              <div key={submission.id} className={styles.submissionItem}>
                <div className={styles.submissionInfo}>
                  <h3>{submission.studentName}</h3>
                  <p className={styles.assignmentName}>
                    {submission.assignmentTitle}
                  </p>
                  <p className={styles.courseCode}>{submission.course}</p>
                </div>
                <div className={styles.gradeDisplay}>
                  <span className={styles.gradeValue}>{submission.grade}</span>
                  <span className={styles.gradeLabel}>/ 100</span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className={styles.detailView}>
          <button
            className={styles.backBtn}
            onClick={() => setView("list")}
          >
            ← Back to Submissions
          </button>

          {selectedSubmission && (
            <div className={styles.gradingForm}>
              <div className={styles.submissionDetails}>
                <h2>{selectedSubmission.assignmentTitle}</h2>
                <div className={styles.detailsGrid}>
                  <div>
                    <span className={styles.label}>Student:</span>
                    <span>{selectedSubmission.studentName}</span>
                  </div>
                  <div>
                    <span className={styles.label}>Course:</span>
                    <span>{selectedSubmission.course}</span>
                  </div>
                  <div>
                    <span className={styles.label}>Submitted:</span>
                    <span>{selectedSubmission.submittedDate}</span>
                  </div>
                  <div>
                    <span className={styles.label}>Email:</span>
                    <span>{selectedSubmission.studentEmail}</span>
                  </div>
                </div>
              </div>

              <div className={styles.formSection}>
                <label className={styles.formLabel}>Grade (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className={styles.gradeInput}
                  placeholder="Enter grade"
                />
              </div>

              <div className={styles.formSection}>
                <label className={styles.formLabel}>Feedback & Comments</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className={styles.feedbackInput}
                  placeholder="Provide constructive feedback for the student..."
                  rows="6"
                />
              </div>

              <div className={styles.actionButtons}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => setView("list")}
                >
                  Cancel
                </button>
                <button
                  className={styles.submitBtn}
                  onClick={handleSubmitGrade}
                  disabled={!grade}
                >
                  Submit Grade & Feedback
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DoctorGrading;
