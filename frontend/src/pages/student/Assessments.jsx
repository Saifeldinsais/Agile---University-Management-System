import { useState, useEffect } from "react";
import styles from "./StudentPages.module.css";
import assignmentSubmissionService from "../../services/assignmentSubmissionService";

function Assessments() {
  const [activeTab, setActiveTab] = useState("overview");
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Assessments & Grades - Performance Tracking';
  }, []);

  useEffect(() => {
    if (activeTab === "assignments") {
      loadAssignments();
    }
  }, [activeTab]);

  const loadAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await assignmentSubmissionService.getStudentAssignments();
      setAssignments(response.data || response.assignments || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load assignments");
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>📊 Assessments & Grades</h1>
        <p>View your assignments, quizzes, exams, and received grades with feedback</p>
      </div>

      <div className={styles.pageContent}>
        {activeTab === "overview" && (
          <>
            <div className={styles.section}>
              <h2>Assessments & Performance</h2>
              <p style={{ color: '#6b7280' }}>
                Track all course assessments including assignments, quizzes, and exams. 
                View your submission status, grades, and instructor feedback once released.
              </p>
              
              <div className={styles.featureList}>
                <div className={styles.feature} onClick={() => setActiveTab("assignments")} style={{ cursor: 'pointer' }}>
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
          </>
        )}

        {activeTab === "assignments" && (
          <div className={styles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>📝 My Assignments</h2>
              <button 
                onClick={() => setActiveTab("overview")}
                style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}
              >
                ← Back
              </button>
            </div>

            {loading && <p style={{ color: '#6b7280' }}>Loading assignments...</p>}
            {error && <p style={{ color: '#ef4444' }}>⚠️ {error}</p>}
            
            {!loading && !error && assignments.length === 0 && (
              <p style={{ color: '#6b7280' }}>No assignments available at this time.</p>
            )}

            {!loading && !error && assignments.length > 0 && (
              <div style={{ display: 'grid', gap: '16px' }}>
                {assignments.map((assignment) => (
                  <div 
                    key={assignment.assignment_id} 
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: '#f9fafb',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h3 style={{ margin: '0 0 8px 0' }}>{assignment.assignment_name || assignment.assignment_title || 'Assignment'}</h3>
                        <p style={{ color: '#6b7280', margin: '8px 0' }}>
                          {assignment.description || 'No description provided'}
                        </p>
                        <p style={{ color: '#6b7280', fontSize: '0.9em', margin: '8px 0' }}>
                          <strong>Deadline:</strong> {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : 'No deadline'}
                        </p>
                      </div>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '0.85em',
                        fontWeight: '500',
                        backgroundColor: assignment.submission_status === 'submitted' ? '#d1fae5' : '#fef3c7',
                        color: assignment.submission_status === 'submitted' ? '#065f46' : '#78350f'
                      }}>
                        {assignment.submission_status === 'submitted' ? '✓ Submitted' : '⏳ Not Submitted'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Assessments;
