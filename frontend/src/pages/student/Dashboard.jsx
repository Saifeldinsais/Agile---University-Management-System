import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../services/config";
import StudentService from "../../services/studentService";
import Course from "./Course/Course";
import EnrolledCourse from "./EnrolledCourse/EnrolledCourse";

import styles from "./Dashboard.module.css";

function Dashboard() {

  const [refreshEnrolled, setRefreshEnrolled] = useState(false);

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



  return (
    <>

      <h1>Courses Available</h1>
      <div className={styles.coursesContainer}>

        {courses.map((e) => (
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
      </div>
    </>
  );
}

export default Dashboard;
