import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import styles from "./DoctorStudents.module.css";

const API = "http://localhost:5000";

function DoctorStudents() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [students, setStudents] = useState([]);

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchDoctorCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCourseId) fetchStudents(selectedCourseId);
    else setStudents([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId]);

  const fetchDoctorCourses = async () => {
    try {
      setLoadingCourses(true);
      setError("");

      const userId = localStorage.getItem("userId");
      const userData = localStorage.getItem("user");
      const doctorId = userId || (userData ? JSON.parse(userData).id : null);

      if (!doctorId) {
        setError("Doctor ID not found. Please login again.");
        return;
      }

      const res = await axios.get(`${API}/api/doctor/courses/${doctorId}`);

      if (res.data.status === "success") {
        const list = res.data.data || [];
        setCourses(list);

        // auto-select first course
        if (list.length > 0) {
          const firstId = list[0].id || list[0].entity_id;
          setSelectedCourseId(String(firstId));
        }
      } else {
        setError(res.data.message || "Failed to fetch courses");
      }
    } catch (e) {
      setError(e.response?.data?.message || "Error fetching courses");
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchStudents = async (courseId) => {
    try {
      setLoadingStudents(true);
      setError("");
    
      console.log(courseId);
      const res = await axios.get(`${API}/api/doctor/courses/${courseId}/students`);

      if (res.data.status === "success") {
        setStudents(res.data.data || []);
      } else {
        setStudents([]);
        setError(res.data.message || "Failed to fetch students");
      }
    } catch (e) {
      setStudents([]);
      setError(e.response?.data?.message || "Error fetching students");
    } finally {
      setLoadingStudents(false);
    }
  };

  const selectedCourse = useMemo(() => {
    return courses.find((c) => String(c.id || c.entity_id) === String(selectedCourseId)) || null;
  }, [courses, selectedCourseId]);

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;

    return students.filter((s) => {
      const name = String(s.name || s.fullName || s.username || "").toLowerCase();
      const email = String(s.email || "").toLowerCase();
      const code = String(s.studentCode || s.code || s.entity_name || "").toLowerCase();
      return name.includes(q) || email.includes(q) || code.includes(q);
    });
  }, [students, query]);

  return (
    <div className={styles.page}>
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>My Students</h1>
            <p className={styles.subtitle}>
              Select a course to view enrolled students. You can search by name, email, or student code.
            </p>
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.control}>
            <label className={styles.label}>Course</label>
            {loadingCourses ? (
              <div className={styles.skeletonInput} />
            ) : (
              <select
                className={styles.select}
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                disabled={courses.length === 0}
              >
                {courses.length === 0 ? (
                  <option value="">No courses assigned</option>
                ) : (
                  courses.map((c) => {
                    const id = c.id || c.entity_id;
                    const code = c.code || c.entity_name || `COURSE-${id}`;
                    const title = c.title || "Untitled";
                    return (
                      <option key={id} value={String(id)}>
                        {code} — {title}
                      </option>
                    );
                  })
                )}
              </select>
            )}
          </div>

          <div className={styles.control}>
            <label className={styles.label}>Search</label>
            <input
              className={styles.input}
              placeholder="Search students..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={!selectedCourseId}
            />
          </div>
        </div>

        {selectedCourse && (
          <div className={styles.courseMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Course:</span>
              <span className={styles.metaValue}>
                {selectedCourse.code || selectedCourse.entity_name || `COURSE-${selectedCourseId}`}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Title:</span>
              <span className={styles.metaValue}>{selectedCourse.title || "N/A"}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Students:</span>
              <span className={styles.metaValue}>{students.length}</span>
            </div>
          </div>
        )}
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.contentCard}>
        {loadingStudents ? (
          <div className={styles.loadingBox}>Loading students...</div>
        ) : !selectedCourseId ? (
          <div className={styles.emptyBox}>Choose a course first.</div>
        ) : filteredStudents.length === 0 ? (
          <div className={styles.emptyBox}>No students found.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Student Code</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.id || s.entity_id || s.email}>
                    <td className={styles.cellStrong}>{s.name || s.fullName || s.username || "Unknown"}</td>
                    <td>{s.email || "—"}</td>
                    <td>{s.studentCode || s.code || s.entity_name || "—"}</td>
                    <td>
                      <span className={styles.statusPill}>
                        {s.status || "active"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorStudents;
