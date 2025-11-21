import { useState , useEffect } from "react";
import { API_BASE_URL } from "../../services/config";
import StudentService from "../../services/studentService";
import Course from "./Course/Course";
import EnrolledCourse from "./EnrolledCourse/EnrolledCourse";

import styles from "./Dashboard.module.css";

function Dashboard() {

    const [refreshEnrolled, setRefreshEnrolled] = useState(false);

    const [student , _setStudent] = useState(() => { //getStudent
      const storedStudent = localStorage.getItem("student");
      if (!storedStudent) {
        return null
        }
      try {
        return JSON.parse(storedStudent);
      } catch (err) {
        console.error('Failed to parse stored student:', err);
        localStorage.removeItem('student');
        return null;
      }
    });

    const [courses, setCourses] = useState([]);

    useEffect(() => {
      const fetchCourses = async () => {
        if (!student?._id) return;

        try {
          const res = await fetch(`${API_BASE_URL}/student/viewCourses`);
          const data = await res.json();
          setCourses(data);
        } catch (err) {
          console.error("Error fetching courses:", err);
        }
      };

      fetchCourses();
    }, [student]);

    const handleEnroll = async (courseId) => {
      if (!student?._id) {
        alert("No student logged in.");
        return;
      }

      try {
        const res = await StudentService.enrollCourse(student._id, courseId);

        if (res.status === 200 || res.status === 201) {
          alert("Successfully enrolled in course!");
          setRefreshEnrolled(prev => !prev)
        }
        else {
          alert("Enrollment failed.");
        }
      } catch (err) {
        console.error(err);
        if(err.status === 400){
          alert("Student Already Enrolled")
        }
        else {
          alert("Error enrolling in course.");
        }
      }
    };
    const handleDrop = async (courseId) => {
      if (!student?._id) {
        alert("No student logged in.");
        return;
      }

      try {
        const res = await StudentService.dropCourse(student._id, courseId);

        if (res.status === 200 || res.status === 201) {
          alert("Successfully Requested to drop course!");
          setRefreshEnrolled(prev => !prev)
        }
        else {
          alert("Request failed.");
        }
      } catch (err) {
        console.error(err);
        if(err.status === 400){
          alert("Student Already Requested Drop")
        }
        else {
          alert("Error Dropping the course.");
        }
      }
    };

    const [enrolled , setEnrolled] = useState([]);

    useEffect(() => {
      const fetchEnrolled = async () => {
        if (!student?._id) return;

        try {
          const res = await fetch(`${API_BASE_URL}/student/enrolled/${student._id}`);
          const data = await res.json();

          setEnrolled(data.courses || []);
        } catch (err) {
          console.error("Error fetching enrolled courses:", err);
        }
      };

      fetchEnrolled();
    }, [student , refreshEnrolled]);



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
              key={e._id}
              course={e.course}
              status={e.status}
              grade={e.grade}
              onDrop={() => handleDrop(e.course._id)}
            />
          ))}
        </div>
    </>
  );
}

export default Dashboard;
