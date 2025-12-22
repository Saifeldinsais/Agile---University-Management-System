import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL } from "../../services/config";
import StudentService from "../../services/studentService";
import socketService from "../../services/socketService";
import Course from "./Course/Course";
import EnrolledCourse from "./EnrolledCourse/EnrolledCourse";

import styles from "./Dashboard.module.css";

function Dashboard() {

  const [refreshEnrolled, setRefreshEnrolled] = useState(false);
  const [notification, setNotification] = useState(null);

  const [student, _setStudent] = useState(() => { //getStudent
    // Try 'user' first (new key), then 'student' (old key)
    const storedUser = localStorage.getItem("user") || localStorage.getItem("student");
    if (!storedUser) {
      return null;
    }
    try {
      return JSON.parse(storedUser);
    } catch (err) {
      console.error('Failed to parse stored user:', err);
      localStorage.removeItem('user');
      localStorage.removeItem('student');
      return null;
    }
  });

  const [courses, setCourses] = useState([]);

  // Socket.io connection for real-time updates
  useEffect(() => {
    socketService.connect();
    socketService.joinRoom("student");

    // Listen for enrollment updates (admin approve/reject)
    const handleEnrollmentUpdated = (data) => {
      console.log("Enrollment status updated:", data);

      // Update local enrolled courses
      setEnrolled((prev) =>
        prev.map((e) =>
          e.enrollmentId === data.enrollmentId
            ? { ...e, status: data.status.toLowerCase() }
            : e
        )
      );

      // Show notification
      const message = data.action === "APPROVE"
        ? "Your enrollment has been approved! 🎉"
        : `Your enrollment was rejected. ${data.note ? `Reason: ${data.note}` : ''}`;

      setNotification({ message, type: data.action === "APPROVE" ? "success" : "error" });
      setTimeout(() => setNotification(null), 5000);
    };

    socketService.on("enrollment-updated", handleEnrollmentUpdated);

    return () => {
      socketService.off("enrollment-updated", handleEnrollmentUpdated);
    };
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        console.log('Fetching courses from:', `${API_BASE_URL}/student/viewCourses`);
        const res = await fetch(`${API_BASE_URL}/student/viewCourses`);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.log('Courses fetched:', data);
        setCourses(data);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setCourses([]); // Set empty array on error
      }
    };

    fetchCourses();
  }, []); // Remove student dependency to always fetch courses


  const handleEnroll = async (courseId) => {
    if (!student?.id) {
      alert("No student logged in.");
      return;
    }

    try {
      const res = await StudentService.enrollCourse(student.id, courseId);

      if (res.status === 200 || res.status === 201) {
        alert("Successfully enrolled in course!");
        setRefreshEnrolled(prev => !prev)
      }
      else {
        alert("Enrollment failed.");
      }
    } catch (err) {
      console.error(err);
      if (err.status === 400) {
        alert("Student Already Enrolled")
      }
      else {
        alert("Error enrolling in course.");
      }
    }
  };
  const handleDrop = async (courseId) => {
    if (!student?.id) {
      alert("No student logged in.");
      return;
    }

    try {
      const res = await StudentService.dropCourse(student.id, courseId);

      if (res.status === 200 || res.status === 201) {
        alert("Successfully Requested to drop course!");
        setRefreshEnrolled(prev => !prev)
      }
      else {
        alert("Request failed.");
      }
    } catch (err) {
      console.error(err);
      if (err.status === 400) {
        alert("Student Already Requested Drop")
      }
      else {
        alert("Error Dropping the course.");
      }
    }
  };

  const [enrolled, setEnrolled] = useState([]);

  useEffect(() => {
    const fetchEnrolled = async () => {
      if (!student?.id) return;

      try {
        const res = await fetch(`${API_BASE_URL}/student/enrolled/${student.id}`);
        const data = await res.json();

        setEnrolled(data.courses || []);
      } catch (err) {
        console.error("Error fetching enrolled courses:", err);
      }
    };

    fetchEnrolled();
  }, [student, refreshEnrolled]);

  // Compute available courses (filter out enrolled ones)
  const availableCourses = useMemo(() => {
    const enrolledCourseIds = enrolled.map(e => parseInt(e.courseId));
    return courses.filter(course => !enrolledCourseIds.includes(parseInt(course._id)));
  }, [courses, enrolled]);

  return (
    <>
      {/* Real-time notification toast */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          padding: '16px 24px',
          borderRadius: 12,
          backgroundColor: notification.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: notification.type === 'success' ? '#065f46' : '#991b1b',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          zIndex: 9999,
          animation: 'slideIn 0.3s ease-out',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <span style={{ fontSize: 20 }}>{notification.type === 'success' ? '✓' : '✗'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      <h1>Courses Available</h1>
      <div className={styles.coursesContainer}>
        {/* Show available courses that aren't enrolled */}
        {availableCourses.map((e) => (
          <Course
            title={e.title || "error"}
            code={e.code || "error"}
            description={e.description || "error"}
            credits={e.credits || "NaN"}
            department={e.department || "error"}
            onEnroll={() => handleEnroll(e._id)}
            key={e._id}
          />
        ))}

        {/* Empty state for available courses */}
        {availableCourses.length === 0 && (
          <p style={{ color: '#6b7280', padding: '20px', textAlign: 'center' }}>
            {courses.length === 0 ? 'No courses available.' : 'You are enrolled in all available courses!'}
          </p>
        )}
      </div>

      <h1>Your Courses</h1>
      <div className={styles.enrolledCourses}>
        {enrolled.map((e) => (
          <EnrolledCourse
            key={e.enrollmentId}
            course={{
              title: e.title,
              code: e.code,
              credits: e.credits,
              department: e.department,
              _id: e.courseId
            }}
            status={e.status}
            grade={e.grade}
            onDrop={() => handleDrop(e.courseId)}
          />
        ))}

        {/* Empty state for enrolled courses */}
        {enrolled.length === 0 && (
          <p style={{ color: '#6b7280', padding: '20px', textAlign: 'center' }}>
            You haven't enrolled in any courses yet. Browse available courses above!
          </p>
        )}
      </div>
    </>
  );
}

export default Dashboard;
