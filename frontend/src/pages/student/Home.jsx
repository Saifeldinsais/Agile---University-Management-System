import { Link } from "react-router-dom";
import { useState } from "react";
import WelcomeBox from "./WelcomeBox/WelcomeBox";


function Home() {


	const [student , _setStudent] = useState(() => {
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

	return (
		<>
		<WelcomeBox studentName={student.username || "Student"}
				grade={student.GPA ?? "2.69"}
				level={student.level ?? "Senior-1"}/>
		</>
	);
}

export default Home;
