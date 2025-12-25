import { useEffect, useMemo, useState } from "react";
import styles from "./Profile.module.css";

function DoctorProfile() {
  const token = useMemo(() => localStorage.getItem("token"), []);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    officeLocation: "",
    officePhone: "",
    bio: "",
    specialization: "",
    role: "",
    department: "",
    status: "",
    hireDate: "",
    roles: [],
  });

  const baseURL = "http://localhost:5000";

  const fetchProfile = async () => {
    // (A) get current user -> email
    const meRes = await fetch(`${baseURL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) throw new Error("Failed to get current user");
    const meJson = await meRes.json();

    const email = meJson?.user?.email || meJson?.user?.data?.email || "";
    if (!email) throw new Error("Current user email not found");

    // (B) get doctor/staff profile by email
    const docRes = await fetch(
      `${baseURL}/api/doctor/by-email?email=${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!docRes.ok) throw new Error("Failed to get doctor profile");
    const docJson = await docRes.json();

    const d = docJson?.data || docJson?.doctor || docJson;

    setProfileData({
      fullName: d?.name || d?.fullName || "",
      email: d?.email || email,
      phone: d?.phone || "",
      officeLocation: d?.officeLocation || "",
      officePhone: d?.officePhone || d?.phone || "",
      bio: d?.bio || "",
      specialization: d?.specialization || "",
      role: d?.role || d?.entityType || "",
      department: d?.department || "",
      status: d?.status || "",
      hireDate: d?.hireDate || "",
      roles: Array.isArray(d?.roles) ? d.roles : [],
    });
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError("");
        await fetchProfile();
      } catch (e) {
        console.error(e);
        setError(e.message || "Failed to load profile");

        // fallback from localStorage
        const localUser = JSON.parse(localStorage.getItem("user") || "null");
        if (localUser?.email) {
          setProfileData((p) => ({
            ...p,
            email: localUser.email,
            fullName: localUser.name || p.fullName,
          }));
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      // ✅ payload includes only editable fields
      const payload = {
        name: profileData.fullName,
        phone: profileData.phone,
        officePhone: profileData.officePhone,
        officeLocation: profileData.officeLocation,
        bio: profileData.bio,
        specialization: profileData.specialization,
      };

      // ✅ route we will implement in backend
      // Suggested: PUT /api/doctor/profile  (auth required, uses req.user)
      const res = await fetch(`${baseURL}/api/doctor/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Failed to update profile");
      }

      // ✅ optional: update localStorage copy
      const localUser = JSON.parse(localStorage.getItem("user") || "null") || {};
      localStorage.setItem(
        "user",
        JSON.stringify({ ...localUser, name: payload.name, phone: payload.phone })
      );

      // ✅ re-fetch from DB to show real saved values
      await fetchProfile();

      setIsEditing(false);
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.container}>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>My Profile</h1>
        <button
          className={styles.editBtn}
          onClick={() => setIsEditing(!isEditing)}
          disabled={saving}
        >
          {isEditing ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}

      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>📚</div>
          <div className={styles.basicInfo}>
            <h2>{profileData.fullName}</h2>
            <p className={styles.role}>
              {profileData.role ? `Dr. (${profileData.role})` : "Dr."}
            </p>
            <p className={styles.department}>
              {profileData.department
                ? `Department of ${profileData.department}`
                : "Department —"}
            </p>
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
                <span className={styles.value}>{profileData.role || "—"}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Department</span>
                <span className={styles.value}>{profileData.department || "—"}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Status</span>
                <span className={styles.value}>{profileData.status || "—"}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Hire Date</span>
                <span className={styles.value}>{profileData.hireDate || "—"}</span>
              </div>
              {profileData.roles?.length > 0 && (
                <div className={styles.infoItem}>
                  <span className={styles.label}>Roles</span>
                  <span className={styles.value}>{profileData.roles.join(", ")}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <div className={styles.actions}>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              className={styles.cancelBtn}
              onClick={() => setIsEditing(false)}
              disabled={saving}
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
