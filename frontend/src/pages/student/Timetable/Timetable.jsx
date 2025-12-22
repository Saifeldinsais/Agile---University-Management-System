import { useState, useEffect } from "react";
import StudentService from "../../../services/studentService";
import styles from "./Timetable.module.css";

function Timetable() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const timeSlots = [
    "08:00-09:00",
    "09:00-10:00",
    "10:00-11:00",
    "11:00-12:00",
    "12:00-13:00",
    "13:00-14:00",
    "14:00-15:00",
    "15:00-16:00",
    "16:00-17:00",
    "17:00-18:00",
  ];

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const response = await StudentService.getTimetable();
      setTimetable(response.data.timetable || []);
      setError("");
    } catch (err) {
      console.error("Error fetching timetable:", err);
      if (err.response?.status === 403) {
        setError("Access denied. Only students can view timetable.");
      } else {
        setError(err.response?.data?.message || "Failed to load timetable");
      }
    } finally {
      setLoading(false);
    }
  };

  const parseSchedule = (schedule) => {
    if (!schedule) return [];
    if (typeof schedule === 'string') {
      try {
        return JSON.parse(schedule);
      } catch {
        return [];
      }
    }
    return Array.isArray(schedule) ? schedule : [];
  };

  const getScheduleForDay = (courseSchedule, day) => {
    const parsed = parseSchedule(courseSchedule);
    return parsed.filter(slot => 
      slot.day && slot.day.toLowerCase() === day.toLowerCase()
    );
  };

  const getTimeSlotIndex = (timeString) => {
    if (!timeString) return -1;
    const startTime = timeString.split('-')[0];
    const hour = parseInt(startTime.split(':')[0]);
    const index = hour - 8;
    return index >= 0 && index < timeSlots.length ? index : -1;
  };

  const buildScheduleGrid = () => {
    const grid = {};
    
    days.forEach(day => {
      grid[day] = {};
      timeSlots.forEach((slot, index) => {
        grid[day][index] = [];
      });
    });

    timetable.forEach(course => {
      const schedule = parseSchedule(course.schedule);
      schedule.forEach(slot => {
        const day = slot.day;
        const timeSlot = slot.start && slot.end ? `${slot.start}-${slot.end}` : slot.time;
        const slotIndex = getTimeSlotIndex(timeSlot);
        
        if (day && slotIndex >= 0) {
          const dayKey = days.find(d => d.toLowerCase() === day.toLowerCase());
          if (dayKey && grid[dayKey] && grid[dayKey][slotIndex]) {
            grid[dayKey][slotIndex].push({
              ...course,
              timeSlot: timeSlot || slot.time,
            });
          }
        }
      });
    });

    return grid;
  };

  if (loading) {
    return <div className={styles.container}><p>Loading timetable...</p></div>;
  }

  if (error) {
    return <div className={styles.container}><div className={styles.error}>{error}</div></div>;
  }

  const scheduleGrid = buildScheduleGrid();

  return (
    <div className={styles.container}>
      <h1>My Weekly Timetable</h1>

      {timetable.length === 0 ? (
        <p className={styles.empty}>No courses enrolled. Your timetable will appear here once you enroll in courses.</p>
      ) : (
        <div className={styles.timetableWrapper}>
          <table className={styles.timetable}>
            <thead>
              <tr>
                <th className={styles.timeHeader}>Time</th>
                {days.map(day => (
                  <th key={day} className={styles.dayHeader}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot, slotIndex) => (
                <tr key={slot}>
                  <td className={styles.timeCell}>{slot}</td>
                  {days.map(day => {
                    const courses = scheduleGrid[day]?.[slotIndex] || [];
                    return (
                      <td key={day} className={styles.cell}>
                        {courses.map((course, idx) => (
                          <div key={`${course.courseId}-${idx}`} className={styles.courseBlock}>
                            <div className={styles.courseCode}>{course.code}</div>
                            <div className={styles.courseTitle}>{course.title}</div>
                            {course.instructor && course.instructor !== "TBA" && (
                              <div className={styles.instructor}>{course.instructor}</div>
                            )}
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {timetable.length > 0 && (
        <div className={styles.courseList}>
          <h2>Enrolled Courses</h2>
          <div className={styles.coursesGrid}>
            {timetable.map(course => {
              const schedule = parseSchedule(course.schedule);
              return (
                <div key={course.courseId} className={styles.courseCard}>
                  <h3>{course.code} - {course.title}</h3>
                  <p><strong>Credits:</strong> {course.credits || 0}</p>
                  <p><strong>Instructor:</strong> {course.instructor || "TBA"}</p>
                  {schedule.length > 0 && (
                    <div className={styles.schedule}>
                      <strong>Schedule:</strong>
                      <ul>
                        {schedule.map((slot, idx) => (
                          <li key={idx}>
                            {slot.day} {slot.start && slot.end ? `${slot.start}-${slot.end}` : slot.time || ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Timetable;

