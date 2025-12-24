import { useState } from "react";
import styles from "./Advisor.module.css";

function DoctorAdvisor() {
  const [advisees, setAdvisees] = useState([
    {
      id: 1,
      name: "Ali Ahmed Hassan",
      email: "ali@uni.edu",
      major: "Computer Science",
      gpa: 3.8,
      semester: "6th",
      status: "Good Standing",
      lastMeeting: "2024-02-10",
    },
    {
      id: 2,
      name: "Noor Fatima",
      email: "noor@uni.edu",
      major: "Computer Science",
      gpa: 3.5,
      semester: "4th",
      status: "Good Standing",
      lastMeeting: "2024-02-12",
    },
    {
      id: 3,
      name: "Mohammed Saeed",
      email: "mohammed.s@uni.edu",
      major: "Information Technology",
      gpa: 2.9,
      semester: "5th",
      status: "Academic Warning",
      lastMeeting: "2024-01-28",
    },
  ]);
  const [selectedAdvisee, setSelectedAdvisee] = useState(null);
  const [view, setView] = useState("list");

  const handleViewDetails = (advisee) => {
    setSelectedAdvisee(advisee);
    setView("detail");
  };

  const statusColor = (status) => {
    if (status === "Good Standing") return "success";
    if (status === "Academic Warning") return "warning";
    return "danger";
  };

  return (
    <div className={styles.container}>
      <h1>Academic Advising</h1>
      <p className={styles.subtitle}>
        Manage and support your assigned advisees throughout their academic journey
      </p>

      {view === "list" ? (
        <div className={styles.adviseesGrid}>
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{advisees.length}</div>
              <div className={styles.statLabel}>Total Advisees</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>
                {advisees.filter((a) => a.status === "Good Standing").length}
              </div>
              <div className={styles.statLabel}>In Good Standing</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>
                {advisees.filter((a) => a.status === "Academic Warning").length}
              </div>
              <div className={styles.statLabel}>Academic Warnings</div>
            </div>
          </div>

          <h2>My Advisees</h2>
          <div className={styles.adviseesList}>
            {advisees.map((advisee) => (
              <div key={advisee.id} className={styles.adviseeCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.name}>{advisee.name}</div>
                  <span
                    className={`${styles.badge} ${styles[statusColor(advisee.status)]}`}
                  >
                    {advisee.status}
                  </span>
                </div>

                <div className={styles.details}>
                  <div className={styles.detail}>
                    <span className={styles.label}>Email:</span>
                    <span>{advisee.email}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.label}>Major:</span>
                    <span>{advisee.major}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.label}>GPA:</span>
                    <span className={styles.gpa}>{advisee.gpa}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.label}>Semester:</span>
                    <span>{advisee.semester}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.label}>Last Meeting:</span>
                    <span className={styles.date}>{advisee.lastMeeting}</span>
                  </div>
                </div>

                <button
                  className={styles.viewBtn}
                  onClick={() => handleViewDetails(advisee)}
                >
                  View Full Profile →
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.detailView}>
          <button
            className={styles.backBtn}
            onClick={() => setView("list")}
          >
            ← Back to Advisees
          </button>

          {selectedAdvisee && (
            <div className={styles.profileCard}>
              <div className={styles.header}>
                <h2>{selectedAdvisee.name}</h2>
                <span
                  className={`${styles.badge} ${styles[statusColor(selectedAdvisee.status)]}`}
                >
                  {selectedAdvisee.status}
                </span>
              </div>

              <div className={styles.grid}>
                {/* Academic Summary */}
                <div className={styles.section}>
                  <h3>Academic Summary</h3>
                  <div className={styles.info}>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Major</span>
                      <span>{selectedAdvisee.major}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Current Semester</span>
                      <span>{selectedAdvisee.semester}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Cumulative GPA</span>
                      <span className={styles.gpa}>{selectedAdvisee.gpa}</span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className={styles.section}>
                  <h3>Contact Information</h3>
                  <div className={styles.info}>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Email</span>
                      <span>{selectedAdvisee.email}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Last Meeting</span>
                      <span>{selectedAdvisee.lastMeeting}</span>
                    </div>
                  </div>
                </div>

                {/* Action Items */}
                <div className={styles.section}>
                  <h3>Quick Actions</h3>
                  <button className={styles.actionBtn}>Schedule Meeting</button>
                  <button className={styles.actionBtn}>View Course Progress</button>
                  <button className={styles.actionBtn}>Review Transcript</button>
                </div>

                {/* Advising Notes */}
                <div className={styles.section}>
                  <h3>Advising Notes</h3>
                  <textarea
                    className={styles.notesArea}
                    placeholder="Add notes about this advisee's progress, concerns, or recommendations..."
                    rows="6"
                  />
                  <button className={styles.saveNotesBtn}>Save Notes</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DoctorAdvisor;
