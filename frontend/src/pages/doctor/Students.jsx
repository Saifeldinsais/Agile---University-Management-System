import { useEffect, useMemo, useState } from "react";
import styles from "./Students.module.css";

function DoctorStudents() {
  const token = useMemo(() => localStorage.getItem("token"), []);
  const baseURL = "http://localhost:5000";

  const [doctorEntityId, setDoctorEntityId] = useState(null);

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [students, setStudents] = useState([]); // visible list (either all or per course)
  const [allStudentsCache, setAllStudentsCache] = useState([]); // merged all-courses

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const [errorCourses, setErrorCourses] = useState("");
  const [errorStudents, setErrorStudents] = useState("");

  const authHeaders = () => ({
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

  // ------------------ API ------------------
  const loadMe = async () => {
    const res = await fetch(`${baseURL}/api/auth/me`, { headers: authHeaders() });
    const json = await safeJson(res);
    if (!res.ok) throw new Error(json?.message || "Failed to get current user");

    const id = json?.user?.id ?? json?.user?.data?.id ?? json?.id ?? null;
    if (!id) throw new Error("doctorEntityId not found in /auth/me response");
    return id;
  };

  const loadCourses = async (doctorId) => {
    const res = await fetch(`${baseURL}/api/doctor/courses/${doctorId}`, {
      headers: authHeaders(),
    });
    const json = await safeJson(res);
    if (!res.ok) throw new Error(json?.message || "Failed to get doctor courses");

    const list = json?.data || [];
    return list.map((c) => ({
      id: c.id,
      code: c.code || `COURSE-${c.id}`,
      title: c.title || "Untitled",
    }));
  };

  const loadStudentsForCourse = async (courseId) => {
    const res = await fetch(`${baseURL}/api/doctor/courses/${courseId}/students`, {
      headers: authHeaders(),
    });
    const json = await safeJson(res);
    if (!res.ok) throw new Error(json?.message || "Failed to get course students");

    // your backend returns:
    // { enrollmentId, id(studentId), name, email, status, grade }
    const list = json?.data || [];

    // normalize + add courseId so we can merge safely
    return list.map((s) => ({
      enrollmentId: s.enrollmentId,
      id: s.id, // studentId
      name: s.name || "Unknown",
      email: s.email || "",
      status: s.status || "APPROVED",
      grade: s.grade ?? null,
      courseId: Number(courseId),
    }));
  };

  const loadAllStudents = async (coursesList) => {
    const results = await Promise.allSettled(
      coursesList.map((c) => loadStudentsForCourse(c.id))
    );

    const merged = [];
    for (const r of results) {
      if (r.status === "fulfilled") merged.push(...r.value);
    }

    // optional: remove duplicates if the same student appears in multiple courses
    // Here we keep them as separate rows because enrollmentId differs per course.
    return merged;
  };

  // ------------------ INIT: me + courses + all students ------------------
  useEffect(() => {
    const run = async () => {
      try {
        setLoadingCourses(true);
        setLoadingStudents(true);
        setErrorCourses("");
        setErrorStudents("");

        const id = await loadMe();
        setDoctorEntityId(id);

        const coursesList = await loadCourses(id);
        setCourses(coursesList);

        const all = await loadAllStudents(coursesList);
        setAllStudentsCache(all);
        setStudents(all); // default: All Students
      } catch (e) {
        console.error(e);
        setErrorCourses(e.message || "Failed to load doctor data");
        setCourses([]);
        setStudents([]);
        setAllStudentsCache([]);
      } finally {
        setLoadingCourses(false);
        setLoadingStudents(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ------------------ when selecting a course: load students for that course ------------------
  useEffect(() => {
    const run = async () => {
      // All Students
      if (!selectedCourse) {
        setStudents(allStudentsCache);
        setErrorStudents("");
        return;
      }

      try {
        setLoadingStudents(true);
        setErrorStudents("");

        const list = await loadStudentsForCourse(selectedCourse.id);
        setStudents(list);
      } catch (e) {
        console.error(e);
        setStudents([]);
        setErrorStudents(e.message || "Failed to load students");
      } finally {
        setLoadingStudents(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse]);

  const courseLabelById = (courseId) => {
    const c = courses.find((x) => String(x.id) === String(courseId));
    return c ? `${c.code}: ${c.title}` : `COURSE-${courseId}`;
  };

  return (
    <div className={styles.container}>
      <h1>Students Monitoring (Read-Only)</h1>
      <p className={styles.note}>
        ℹ️ This section is for monitoring only. Student records cannot be modified here.
      </p>

      {(loadingCourses || loadingStudents) && (
        <p className={styles.note}>Loading...</p>
      )}

      {errorCourses && <p className={styles.empty} style={{ color: "red" }}>{errorCourses}</p>}
      {errorStudents && <p className={styles.empty} style={{ color: "red" }}>{errorStudents}</p>}

      <div className={styles.layout}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <h3>Courses</h3>

          <div className={styles.courseList}>
            <button
              className={`${styles.courseItem} ${!selectedCourse ? styles.active : ""}`}
              onClick={() => setSelectedCourse(null)}
              disabled={loadingCourses || courses.length === 0}
            >
              All Students
            </button>

            {courses.map((course) => (
              <button
                key={course.id}
                className={`${styles.courseItem} ${
                  selectedCourse?.id === course.id ? styles.active : ""
                }`}
                onClick={() => setSelectedCourse(course)}
                disabled={loadingCourses}
              >
                <span className={styles.code}>{course.code}</span>
                {/* students count from backend would require an endpoint; for now show current count if selected */}
                <span className={styles.count}>
                  {selectedCourse?.id === course.id ? students.length : "—"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          <div className={styles.header}>
            <h2>
              {selectedCourse
                ? `${selectedCourse.code}: ${selectedCourse.title}`
                : "All Students"}
            </h2>
            <span className={styles.studentCount}>{students.length} students</span>
          </div>

          <div className={styles.studentGrid}>
            {students.map((student) => (
              <div key={`${student.enrollmentId}-${student.courseId}`} className={styles.studentCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.studentName}>{student.name}</div>

                  {/* You can style status badges by adding CSS classes: approved/rejected/pending */}
                  <span
                    className={`${styles.engagement} ${
                      styles[String(student.status || "").toLowerCase()] || ""
                    }`}
                  >
                    {student.status}
                  </span>
                </div>

                <div className={styles.details}>
                  <div className={styles.detail}>
                    <span className={styles.label}>Email:</span>
                    <span className={styles.value}>{student.email || "—"}</span>
                  </div>

                  <div className={styles.detail}>
                    <span className={styles.label}>Course:</span>
                    <span className={styles.value}>{courseLabelById(student.courseId)}</span>
                  </div>

                  <div className={styles.detail}>
                    <span className={styles.label}>Grade:</span>
                    <span className={styles.value}>
                      {student.grade === null ? "—" : student.grade}
                    </span>
                  </div>
                </div>

                <div className={styles.action}>
                  <button className={styles.viewBtn} disabled>
                    View Profile (Read-Only)
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!loadingStudents && students.length === 0 && (
            <p className={styles.empty}>No students in this course</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DoctorStudents;
