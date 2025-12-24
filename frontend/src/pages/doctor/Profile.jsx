import { useState } from "react";
import styles from "./Profile.module.css";

function DoctorProfile() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: user.fullName || "Dr. Ahmed Mohammed",
    email: user.email || "ahmed@university.edu",
    phone: user.phone || "+966 50 123 4567",
    officeLocation: "Building A, Office 301",
    officePhone: "+966 11 4567 890",
    bio: "Professor of Computer Science with 15 years of experience",
    specialization: "Data Structures and Algorithms",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const updatedUser = { ...user, ...profileData };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setIsEditing(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>My Profile</h1>
        <button
          className={styles.editBtn}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>📚</div>
          <div className={styles.basicInfo}>
            <h2>{profileData.fullName}</h2>
            <p className={styles.role}>Dr. (Assistant Professor)</p>
            <p className={styles.department}>Department of Computer Science</p>
          </div>
        </div>

        <div className={styles.grid}>
          {/* Personal Information */}
          <div className={styles.section}>
            <h3>Personal Information</h3>
            {isEditing ? (
              <div className={styles.form}>
                <div className={styles.formGroup}>
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Bio / About</label>
                  <textarea
                    name="bio"
                    value={profileData.bio}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Specialization</label>
                  <input
                    type="text"
                    name="specialization"
                    value={profileData.specialization}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            ) : (
              <div className={styles.info}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Full Name</span>
                  <span className={styles.value}>{profileData.fullName}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Bio</span>
                  <span className={styles.value}>{profileData.bio}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Specialization</span>
                  <span className={styles.value}>{profileData.specialization}</span>
                </div>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className={styles.section}>
            <h3>Contact Information</h3>
            {isEditing ? (
              <div className={styles.form}>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    disabled
                    className={styles.disabled}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Personal Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Office Phone</label>
                  <input
                    type="tel"
                    name="officePhone"
                    value={profileData.officePhone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            ) : (
              <div className={styles.info}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Email</span>
                  <span className={styles.value}>{profileData.email}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Personal Phone</span>
                  <span className={styles.value}>{profileData.phone}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Office Phone</span>
                  <span className={styles.value}>{profileData.officePhone}</span>
                </div>
              </div>
            )}
          </div>

          {/* Office Information */}
          <div className={styles.section}>
            <h3>Office Information</h3>
            {isEditing ? (
              <div className={styles.form}>
                <div className={styles.formGroup}>
                  <label>Office Location</label>
                  <input
                    type="text"
                    name="officeLocation"
                    value={profileData.officeLocation}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            ) : (
              <div className={styles.info}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Location</span>
                  <span className={styles.value}>{profileData.officeLocation}</span>
                </div>
                <div className={styles.note}>
                  📌 Role and Department information are read-only and managed by administration.
                </div>
              </div>
            )}
          </div>

          {/* Academic Information (Read-Only) */}
          <div className={styles.section}>
            <h3>Academic Information (Read-Only)</h3>
            <div className={styles.info}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Title</span>
                <span className={styles.value}>Assistant Professor</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Department</span>
                <span className={styles.value}>Computer Science</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Years of Experience</span>
                <span className={styles.value}>15 years</span>
              </div>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className={styles.actions}>
            <button className={styles.saveBtn} onClick={handleSave}>
              Save Changes
            </button>
            <button
              className={styles.cancelBtn}
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorProfile;
