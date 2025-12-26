import { useState, useEffect, useMemo } from "react";
import styles from "./Grading.module.css";

// Letter grade to GPA mapping (4.0 scale)
const GRADE_OPTIONS = [
  { letter: "A+", gpa: 4.0 },
  { letter: "A", gpa: 4.0 },
  { letter: "A-", gpa: 3.7 },
  { letter: "B+", gpa: 3.3 },
  { letter: "B", gpa: 3.0 },
  { letter: "B-", gpa: 2.7 },
  { letter: "C+", gpa: 2.3 },
  { letter: "C", gpa: 2.0 },
  { letter: "C-", gpa: 1.7 },
  { letter: "D+", gpa: 1.3 },
  { letter: "D", gpa: 1.0 },
  { letter: "D-", gpa: 0.7 },
  { letter: "F", gpa: 0.0 },
  { letter: "F*", gpa: 0.0 },
];

// Convert GPA number to letter grade
const gpaToLetter = (gpa) => {
  if (gpa === null || gpa === undefined) return null;
  const numGpa = parseFloat(gpa);

  // Find closest match
  for (const grade of GRADE_OPTIONS) {
    if (Math.abs(grade.gpa - numGpa) < 0.05) {
      return grade.letter;
    }
  }

  // If no exact match, find closest
  let closest = GRADE_OPTIONS[0];
  let minDiff = Math.abs(GRADE_OPTIONS[0].gpa - numGpa);

  for (const grade of GRADE_OPTIONS) {
    const diff = Math.abs(grade.gpa - numGpa);
    if (diff < minDiff) {
      minDiff = diff;
      closest = grade;
    }
  }

  return closest.letter;
};

function DoctorGrading() {
  const token = useMemo(() => localStorage.getItem("token"), []);
  const baseURL = "http://localhost:5000";

  const [doctorEntityId, setDoctorEntityId] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [students, setStudents] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingGrade, setSavingGrade] = useState(null);

  // Track grades for each student - keyed by enrollmentId
  const [pendingGrades, setPendingGrades] = useState({});

  const authHeaders = () => ({ Authorization: `Bearer ${token}` });
  const jsonHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const safeJson = async (res) => {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return { raw: text };
    }
  };

  // Load current user
  const loadMe = async () => {
    const res = await fetch(`${baseURL}/api/auth/me`, { headers: authHeaders() });
    const json = await safeJson(res);
    if (!res.ok) throw new Error(json?.message || "Failed to get current user");
    return json?.user?.id ?? json?.id ?? null;
  };

  // Load doctor's courses
  const loadCourses = async (entityId) => {
    const res = await fetch(`${baseURL}/api/doctor/courses/${entityId}`, { headers: authHeaders() });
    const json = await safeJson(res);
    if (!res.ok) throw new Error(json?.message || "Failed to load courses");
    return (json?.data || []).map((c) => ({
      id: c.id,
      code: c.code || `COURSE-${c.id}`,
      title: c.title || "Untitled",
    }));
  };

  // Load students for a course
  const loadStudents = async (courseId) => {
    setLoadingStudents(true);
    try {
      const res = await fetch(`${baseURL}/api/doctor/courses/${courseId}/students`, { headers: authHeaders() });
      const json = await safeJson(res);
      if (!res.ok) throw new Error(json?.message || "Failed to load students");

      // Filter students that can be graded (approved, completed, or failed)
      const gradableStudents = (json?.data || []).filter(
        s => ['APPROVED', 'COMPLETED', 'FAILED'].includes(s.status?.toUpperCase())
      );

      setStudents(gradableStudents);
    } catch (err) {
      alert(err.message);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Save grade for a student
  const saveGrade = async (enrollmentId, letterGrade) => {
    const gradeOption = GRADE_OPTIONS.find(g => g.letter === letterGrade);
    if (!gradeOption) {
      alert("Invalid grade selected");
      return;
    }

    setSavingGrade(enrollmentId);
    try {
      const res = await fetch(`${baseURL}/api/doctor/enrollments/${enrollmentId}/grade`, {
        method: "PUT",
        headers: jsonHeaders(),
        body: JSON.stringify({
          grade: gradeOption.gpa,
          letterGrade: gradeOption.letter  // Send letter grade too
        }),
      });

      const json = await safeJson(res);
      if (!res.ok) throw new Error(json?.message || "Failed to save grade");

      // Update local state
      setStudents(prev => prev.map(s =>
        s.enrollmentId === enrollmentId
          ? { ...s, grade: gradeOption.gpa, letterGrade: gradeOption.letter }
          : s
      ));

      // Clear pending grade
      setPendingGrades(prev => {
        const updated = { ...prev };
        delete updated[enrollmentId];
        return updated;
      });

      alert(`Grade ${letterGrade} saved successfully!`);
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingGrade(null);
    }
  };

  // Initialize
  useEffect(() => {
    const init = async () => {
      try {
        setLoadingCourses(true);
        const id = await loadMe();
        setDoctorEntityId(id);
        const courseList = await loadCourses(id);
        setCourses(courseList);
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setLoadingCourses(false);
      }
    };
    init();
  }, [token]);

  // Load students when course changes
  useEffect(() => {
    if (selectedCourseId) {
      loadStudents(selectedCourseId);
    } else {
      setStudents([]);
    }
  }, [selectedCourseId]);

  const gradedCount = students.filter(s => s.grade !== null && s.grade !== undefined).length;
  const pendingCount = students.length - gradedCount;

  return (
    <div className={styles.container}>
      <h1>Grading & Evaluation</h1>

      {/* Course Selection */}
      <div className={styles.courseSelector}>
        <label>Select Course:</label>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          disabled={loadingCourses}
          className={styles.courseSelect}
        >
          <option value="">-- Select a Course --</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code}: {c.title}
            </option>
          ))}
        </select>
      </div>

      {selectedCourseId && (
        <>
          {/* Stats */}
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{pendingCount}</div>
              <div className={styles.statLabel}>Pending Grading</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{gradedCount}</div>
              <div className={styles.statLabel}>Already Graded</div>
            </div>
          </div>

          {/* Students List */}
          <div className={styles.submissionsList}>
            <h2>Enrolled Students</h2>

            {loadingStudents ? (
              <p className={styles.empty}>Loading students...</p>
            ) : students.length === 0 ? (
              <p className={styles.empty}>No approved students in this course</p>
            ) : (
              <div className={styles.studentsTable}>
                <table>
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>Current Grade</th>
                      <th>Assign Grade</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const currentLetter = gpaToLetter(student.grade);
                      const pendingLetter = pendingGrades[student.enrollmentId];
                      const displayGrade = pendingLetter || currentLetter || "-";

                      return (
                        <tr key={student.enrollmentId}>
                          <td className={styles.studentName}>{student.name}</td>
                          <td className={styles.studentEmail}>{student.email || "N/A"}</td>
                          <td>
                            <span className={`${styles.gradeBadge} ${currentLetter ? styles.graded : styles.pending}`}>
                              {currentLetter || "Not Graded"}
                            </span>
                          </td>
                          <td>
                            <select
                              value={pendingLetter || currentLetter || ""}
                              onChange={(e) => {
                                setPendingGrades(prev => ({
                                  ...prev,
                                  [student.enrollmentId]: e.target.value
                                }));
                              }}
                              className={styles.gradeSelect}
                            >
                              <option value="">Select Grade</option>
                              {GRADE_OPTIONS.map((g) => (
                                <option key={g.letter} value={g.letter}>
                                  {g.letter} (GPA: {g.gpa.toFixed(1)})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <button
                              className={styles.saveBtn}
                              onClick={() => saveGrade(student.enrollmentId, pendingGrades[student.enrollmentId] || currentLetter)}
                              disabled={
                                savingGrade === student.enrollmentId ||
                                (!pendingGrades[student.enrollmentId] && !currentLetter)
                              }
                            >
                              {savingGrade === student.enrollmentId ? "Saving..." : "Save Grade"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {!selectedCourseId && !loadingCourses && (
        <div className={styles.selectCoursePrompt}>
          <p>👆 Please select a course above to view and grade students</p>
        </div>
      )}
    </div>
  );
}

export default DoctorGrading;
