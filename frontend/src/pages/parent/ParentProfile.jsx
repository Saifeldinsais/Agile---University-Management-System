import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import parentService from "../../services/parentService";
import "./ParentPages.css";

function ParentProfile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState({
        full_name: "",
        email: "",
        phone: "",
        address: "",
        occupation: "",
        notification_preference: "email",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const response = await parentService.getProfile();
            setProfile(response.data);
        } catch (err) {
            setMessage({ type: "error", text: err.message || "Failed to load profile" });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await parentService.updateProfile(profile);
            setMessage({ type: "success", text: "Profile updated successfully!" });
            setIsEditing(false);

            // Update local storage
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem("user", JSON.stringify({ ...user, ...profile }));
        } catch (err) {
            setMessage({ type: "error", text: err.message || "Failed to update profile" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="parent-page loading">
                <div className="spinner"></div>
                <p>Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="parent-page profile-page">
            <h2 className="page-title">My Profile</h2>

            {message && (
                <div className={`message-banner ${message.type}`}>
                    {message.text}
                    <button onClick={() => setMessage(null)}>✕</button>
                </div>
            )}

            <div className="profile-container">
                {/* Profile Header */}
                <div className="profile-header-card">
                    <div className="profile-avatar large">
                        {profile.full_name?.charAt(0) || "P"}
                    </div>
                    <div className="profile-header-info">
                        <h3>{profile.full_name}</h3>
                        <span className="profile-role">Parent</span>
                        <span className="profile-email">{profile.email}</span>
                    </div>
                    {!isEditing && (
                        <button className="edit-btn" onClick={() => setIsEditing(true)}>
                            ✏️ Edit Profile
                        </button>
                    )}
                </div>

                {/* Profile Form */}
                <div className="dashboard-section">
                    <form className="profile-form" onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="full_name">Full Name</label>
                                <input
                                    type="text"
                                    id="full_name"
                                    name="full_name"
                                    value={profile.full_name}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={profile.email}
                                    disabled
                                    className="disabled"
                                />
                                <small>Email cannot be changed</small>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="phone">Phone Number</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={profile.phone}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="occupation">Occupation</label>
                                <input
                                    type="text"
                                    id="occupation"
                                    name="occupation"
                                    value={profile.occupation}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    placeholder="Enter occupation"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="address">Address</label>
                            <textarea
                                id="address"
                                name="address"
                                value={profile.address}
                                onChange={handleChange}
                                disabled={!isEditing}
                                placeholder="Enter address"
                                rows={3}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="notification_preference">Notification Preference</label>
                            <select
                                id="notification_preference"
                                name="notification_preference"
                                value={profile.notification_preference}
                                onChange={handleChange}
                                disabled={!isEditing}
                            >
                                <option value="email">Email</option>
                                <option value="sms">SMS</option>
                                <option value="both">Email & SMS</option>
                                <option value="none">None</option>
                            </select>
                        </div>

                        {isEditing && (
                            <div className="form-actions">
                                <button type="submit" className="submit-btn" disabled={saving}>
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => {
                                        setIsEditing(false);
                                        loadProfile();
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                {/* Account Settings */}
                <div className="dashboard-section">
                    <h3>Account Settings</h3>
                    <div className="settings-list">
                        <div className="setting-item">
                            <div className="setting-info">
                                <h4>Change Password</h4>
                                <p>Update your account password</p>
                            </div>
                            <button className="setting-btn">Change</button>
                        </div>
                        <div className="setting-item danger">
                            <div className="setting-info">
                                <h4>Delete Account</h4>
                                <p>Permanently delete your account and all data</p>
                            </div>
                            <button className="setting-btn danger">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ParentProfile;
