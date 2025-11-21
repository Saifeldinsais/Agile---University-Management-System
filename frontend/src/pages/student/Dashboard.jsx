import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../services/config";
import WelcomeBox from "./WelcomeBox/WelcomeBox";

function Dashboard() {

    const [student , setStudent] = useState(null)

    useEffect(() => {
      const storedStudent = localStorage.getItem("student");
      if (!storedStudent) return;
      try {
        const parsed = JSON.parse(storedStudent);
        setStudent(parsed);
      } catch (err) {
        // If parsing fails, clear the stored value and keep student null
        console.error('Failed to parse stored student:', err);
        localStorage.removeItem('student');
      }
    }, []);

  return (
    <>
        <WelcomeBox name={student?.username ?? "Student"}
              grade={student?.GPA ?? "error"}
              level={student?.level ?? "error"}/>
    </>
  );
}

export default Dashboard;
