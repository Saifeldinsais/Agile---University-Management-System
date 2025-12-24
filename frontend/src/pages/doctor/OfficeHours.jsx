import { useState } from "react";
import styles from "./OfficeHours.module.css";

function DoctorOfficeHours() {
  const [officeHours, setOfficeHours] = useState([]);
  const [meetingRequests, setMeetingRequests] = useState([]);
  const [showAddHours, setShowAddHours] = useState(false);

  const handleApproveMeeting = (id) => {
    setMeetingRequests((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "approved" } : m))
    );
  };

  const handleRejectMeeting = (id) => {
    setMeetingRequests((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "rejected" } : m))
    );
  };

  return (
    <div className={styles.container}>
      <h1>Office Hours & Meeting Management</h1>

      <div className={styles.grid}>
        {/* Office Hours */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>My Office Hours</h2>
            <button
              className={styles.addBtn}
              onClick={() => setShowAddHours(!showAddHours)}
            >
              {showAddHours ? "Cancel" : "+ Add Hours"}
            </button>
          </div>

          {showAddHours && (
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label>Day</label>
                <select>
                  <option>Monday</option>
                  <option>Tuesday</option>
                  <option>Wednesday</option>
                  <option>Thursday</option>
                  <option>Friday</option>
                </select>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Start Time</label>
                  <input type="time" />
                </div>
                <div className={styles.formGroup}>
                  <label>End Time</label>
                  <input type="time" />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Location</label>
                <input type="text" placeholder="e.g., Office 301" />
              </div>
              <button className={styles.submitBtn}>Add Office Hours</button>
            </div>
          )}

          <div className={styles.hoursList}>
            {officeHours.map((hours) => (
              <div key={hours.id} className={styles.hoursItem}>
                <div className={styles.day}>{hours.day}</div>
                <div className={styles.time}>
                  {hours.startTime} - {hours.endTime}
                </div>
                <div className={styles.location}>{hours.location}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Meeting Requests */}
        <div className={styles.section}>
          <h2>Meeting Requests</h2>

          <div className={styles.requestsList}>
            {meetingRequests.length === 0 ? (
              <p className={styles.empty}>No meeting requests</p>
            ) : (
              meetingRequests.map((request) => (
                <div
                  key={request.id}
                  className={`${styles.requestItem} ${styles[request.status]}`}
                >
                  <div className={styles.requestInfo}>
                    <h4>{request.studentName}</h4>
                    <p className={styles.reason}>{request.reason}</p>
                    <p className={styles.datetime}>
                      {request.requestedDate} at {request.requestedTime}
                    </p>
                  </div>

                  <div className={styles.requestStatus}>
                    <span className={`${styles.badge} ${styles[request.status]}`}>
                      {request.status}
                    </span>
                  </div>

                  {request.status === "pending" && (
                    <div className={styles.requestActions}>
                      <button
                        className={styles.approveBtn}
                        onClick={() => handleApproveMeeting(request.id)}
                      >
                        Approve
                      </button>
                      <button
                        className={styles.rejectBtn}
                        onClick={() => handleRejectMeeting(request.id)}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className={styles.section}>
          <h2>Upcoming Meetings</h2>

          <div className={styles.meetingsList}>
            {meetingRequests
              .filter((m) => m.status === "approved")
              .map((meeting) => (
                <div key={meeting.id} className={styles.meetingItem}>
                  <div className={styles.meetingDate}>
                    {meeting.requestedDate}
                  </div>
                  <div className={styles.meetingDetails}>
                    <h4>{meeting.studentName}</h4>
                    <p>{meeting.requestedTime}</p>
                  </div>
                </div>
              ))}
            {meetingRequests.filter((m) => m.status === "approved").length ===
              0 && (
              <p className={styles.empty}>No approved meetings scheduled</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DoctorOfficeHours;
