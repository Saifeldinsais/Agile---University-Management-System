import { useState } from "react";
import { API_BASE_URL } from "../../services/config";
import WelcomeBox from "./WelcomeBox/WelcomeBox";

function Dashboard() {

    const [student , _setStudent] = useState(() => {
      const storedStudent = localStorage.getItem("student");
      if (!storedStudent) {
        console.log("Nullllllll");
        return null
        }
      try {
        console.log("Parsing Student");
        return JSON.parse(storedStudent);
      } catch (err) {
        console.error('Failed to parse stored student:', err);
        localStorage.removeItem('student');
        return null;
      }
    });

  return (
    <>
        <WelcomeBox studentName={student.username || "Student"}
              grade={student.GPA ?? "error"}
              level={student.level ?? "error"}/>
    </>
  );
}

export default Dashboard;
