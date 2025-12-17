import { Link } from "react-router-dom";
import { useState } from "react";
import WelcomeBox from "./WelcomeBox/WelcomeBox";


function Home() {

	const [student, _setStudent] = useState(() => {
		// Try 'user' first (new key), then fall back to 'student' (old key)
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

	// If no user data, show a message
	if (!student) {
		return (
			<div style={{ padding: "2rem", textAlign: "center" }}>
				<h2>Welcome to Student Portal</h2>
				<p>Please log in to view your dashboard.</p>
				<a href="/login">Go to Login</a>
			</div>
		);
	}

	return (
		<>
			<WelcomeBox
				studentName={student.username || "Student"}
				grade={student.GPA ?? "2.69"}
				level={student.level ?? "Senior-1"}
			/>
		</>
	);
}

export default Home;
