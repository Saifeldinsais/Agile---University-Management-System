import { useState, useEffect } from "react";
import styles from "./StudentPages.module.css";
import assignmentSubmissionService from "../../services/assignmentSubmissionService";

function Assessments() {
  const [activeTab, setActiveTab] = useState("overview");
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmitClick = (assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmitModal(true);
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFile(files[0]);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!uploadedFile) {
      alert("Please select a file to upload");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('files', uploadedFile);

      await assignmentSubmissionService.submitAssignment(
        selectedAssignment.assignment_id,
        formData
      );

      alert("Assignment submitted successfully!");
      setShowSubmitModal(false);
      setUploadedFile(null);
      loadAssignments(); // Reload to update status
    } catch (err) {
      alert("Failed to submit assignment: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
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
                {assignments.map((assignment) => {
                  const deadline = assignment.dueDate || assignment.deadline;
                  const isSubmitted = assignment.status === 'submitted' || assignment.submission_status === 'submitted';
                  
                  return (
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
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>
                            {assignment.title || 'Assignment'}
                          </h3>
                          {assignment.course_name && (
                            <p style={{ color: '#6b7280', fontSize: '0.9em', margin: '4px 0' }}>
                              <strong>Course:</strong> {assignment.course_name}
                            </p>
                          )}
                          <p style={{ color: '#6b7280', margin: '8px 0', lineHeight: '1.6' }}>
                            {assignment.description || 'No description provided'}
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                            <p style={{ color: '#6b7280', fontSize: '0.9em', margin: '0' }}>
                              <strong>Deadline:</strong> {deadline ? new Date(deadline).toLocaleString() : 'No deadline'}
                            </p>
                            {assignment.totalMarks && (
                              <p style={{ color: '#6b7280', fontSize: '0.9em', margin: '0' }}>
                                <strong>Total Marks:</strong> {assignment.totalMarks}
                              </p>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '0.85em',
                            fontWeight: '500',
                            backgroundColor: isSubmitted ? '#d1fae5' : '#fef3c7',
                            color: isSubmitted ? '#065f46' : '#78350f',
                            whiteSpace: 'nowrap'
                          }}>
                            {isSubmitted ? '✓ Submitted' : '⏳ Not Submitted'}
                          </span>
                          {!isSubmitted && (
                            <button
                              onClick={() => handleSubmitClick(assignment)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85em',
                                fontWeight: '500'
                              }}
                            >
                              Submit
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit Assignment Modal */}
      {showSubmitModal && selectedAssignment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '12px' }}>Submit Assignment</h2>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>
              {selectedAssignment.title}
            </p>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#374151'
              }}>
                Select File (PDF, Image, or Document)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                onChange={handleFileChange}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              />
              {uploadedFile && (
                <p style={{ color: '#059669', fontSize: '0.9em', marginTop: '8px' }}>
                  ✓ Selected: {uploadedFile.name}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  setUploadedFile(null);
                }}
                disabled={submitting}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#e5e7eb',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  opacity: submitting ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAssignment}
                disabled={submitting || !uploadedFile}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  opacity: submitting || !uploadedFile ? 0.6 : 1
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Assessments;
