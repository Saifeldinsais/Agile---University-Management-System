import { Link } from "react-router-dom";

function DoctorHome() {
    return (
        <div style={{ padding: "2rem" }}>
            <h1>Doctor Dashboard</h1>
            <p>Welcome to the Doctor/Teacher Portal</p>

            <div style={{ marginTop: "2rem" }}>
                <h2>Quick Links</h2>
                <ul>
                    <li><Link to="/doctor/courses">My Courses</Link></li>
                    <li><Link to="/doctor/students">My Students</Link></li>
                    <li><Link to="/doctor/grades">Grade Management</Link></li>
                </ul>
            </div>
        </div>
    );
}

export default DoctorHome;
