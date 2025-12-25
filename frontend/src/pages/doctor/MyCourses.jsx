import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./MyCourses.css";

function DoctorMyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDoctorCourses();
  }, []);

  const fetchDoctorCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = localStorage.getItem("userId");
      const userData = localStorage.getItem("user");

      if (!userId && !userData) {
        setError("User data not found. Please login again.");
        return;
      }

      const doctorId = userId || (userData ? JSON.parse(userData).id : null);
      if (!doctorId) {
        setError("Doctor ID not found.");
        return;
      }

      const res = await axios.get(
        `http://localhost:5000/api/doctor/courses/${doctorId}`
      );

      if (res.data.status === "success") {
        setCourses(res.data.data || []);
      } else {
        setError(res.data.message || "Failed to fetch courses");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching courses");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="doctor-courses-page">
      <div className="doctor-courses-container">
        <div className="doctor-courses-header">
          <div>
            <h1>My Assigned Courses</h1>
            <p>View and manage your courses</p>
          </div>

          <button
            className="back-btn"
            onClick={() => navigate("/doctor")}
          >
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="error-box">
            <span>{error}</span>
            <button onClick={fetchDoctorCourses}>Retry</button>
          </div>
        )}

        {loading ? (
          <div className="skeleton-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="empty-box">
            <h3>No courses assigned yet</h3>
            <p>Courses assigned by admin will appear here.</p>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map((course) => {
              const id = course.entity_id || course.id;
              return (
                <div className="course-card" key={id}>
                  <div className="course-header">
                    <h3>{course.code || "Unnamed Course"}</h3>
                    <span className="badge">Assigned</span>
                  </div>

                  <p><strong>Title:</strong> {course.title || "N/A"}</p>
                  <p><strong>Description:</strong> {course.description || "No description"}</p>

                  <div className="course-meta">
                    {course.credits !== undefined && course.credits !== null && (
                    <p className="course-meta">
                        <strong>Credits:</strong> {parseInt(course.credits, 10)}
                    </p>
                    )}
                    {course.department && <span>{course.department}</span>}
                    {course.semester && <span>{course.semester}</span>}
                  </div>

                  <button
                    className="view-btn"
                    onClick={() =>
                      navigate(`/doctor/courses/${id}`, { state: { course } })
                    }
                  >
                    View Details
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorMyCourses;
