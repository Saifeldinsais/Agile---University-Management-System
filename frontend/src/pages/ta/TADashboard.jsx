import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import staffService from "../../services/staffService";
import "./TADashboard.css";

function TADashboard() {
    const navigate = useNavigate();

    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return null;
        try {
            return JSON.parse(storedUser);
        } catch {
            return null;
        }
    });

    const [staffProfile, setStaffProfile] = useState(null);
    const [responsibilities, setResponsibilities] = useState([]);
    const [officeHours, setOfficeHours] = useState([]);
    const [leaveBalance, setLeaveBalance] = useState(21);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeSection, setActiveSection] = useState("overview");

    // Modal states
    const [showAddResponsibility, setShowAddResponsibility] = useState(false);
    const [newResponsibility, setNewResponsibility] = useState("");
    const [showAddOfficeHour, setShowAddOfficeHour] = useState(false);
    const [newOfficeHour, setNewOfficeHour] = useState({ day: "Monday", start: "09:00", end: "11:00" });
    const [showLeaveForm, setShowLeaveForm] = useState(false);
    const [newLeaveRequest, setNewLeaveRequest] = useState({ leaveType: "annual", startDate: "", endDate: "", reason: "" });

    useEffect(() => {
        if (user?.email) {
            loadStaffProfile();
        } else {
            setLoading(false);
            setError("Please log in to view your dashboard");
        }
    }, [user]);

    const loadStaffProfile = async () => {
        try {
            setLoading(true);
            setError("");

            // Get or create staff profile linked to user email
            const profileRes = await staffService.getOrCreateByEmail(
                user.email,
                user.username || user.email.split('@')[0],
                'ta'
            );

            if (profileRes.status === "success" && profileRes.data) {
                const profile = profileRes.data;
                setStaffProfile(profile);

                // Load all staff data
                await loadAllData(profile.id);
            } else {
                setError("Failed to load staff profile");
            }
        } catch (err) {
            console.error("Error loading staff profile:", err);
            setError("Failed to connect to server");
        } finally {
            setLoading(false);
        }
    };

    const loadAllData = async (staffId) => {
        try {
            // Load responsibilities
            const respRes = await staffService.getTAResponsibilities(staffId);
            if (respRes.status === "success") {
                setResponsibilities(respRes.data || []);
            }

            // Load office hours
            const ohRes = await staffService.getOfficeHours(staffId);
            if (ohRes.status === "success") {
                setOfficeHours(ohRes.data || []);
            }

            // Load leave balance
            const lbRes = await staffService.getLeaveBalance(staffId);
            if (lbRes.status === "success") {
                setLeaveBalance(lbRes.data?.leaveBalance || 21);
            }

            // Load leave requests
            const lrRes = await staffService.getLeaveRequests(staffId);
            if (lrRes.status === "success") {
                setLeaveRequests(lrRes.data || []);
            }
        } catch (err) {
            console.error("Error loading data:", err);
        }
    };

    // ================= RESPONSIBILITIES =================
    const handleAddResponsibility = async () => {
        if (!newResponsibility.trim() || !staffProfile) return;

        const updated = [...responsibilities, {
            id: Date.now(),
            text: newResponsibility.trim(),
            completed: false
        }];

        try {
            await staffService.updateTAResponsibilities(staffProfile.id, updated);
            setResponsibilities(updated);
            setNewResponsibility("");
            setShowAddResponsibility(false);
        } catch (err) {
            console.error("Error saving responsibility:", err);
            alert("Failed to save. Please try again.");
        }
    };

    const toggleResponsibility = async (id) => {
        if (!staffProfile) return;

        const updated = responsibilities.map(r =>
            r.id === id ? { ...r, completed: !r.completed } : r
        );

        try {
            await staffService.updateTAResponsibilities(staffProfile.id, updated);
            setResponsibilities(updated);
        } catch (err) {
            console.error("Error updating:", err);
        }
    };

    const deleteResponsibility = async (id) => {
        if (!staffProfile) return;

        const updated = responsibilities.filter(r => r.id !== id);

        try {
            await staffService.updateTAResponsibilities(staffProfile.id, updated);
            setResponsibilities(updated);
        } catch (err) {
            console.error("Error deleting:", err);
        }
    };

    // ================= OFFICE HOURS =================
    const handleAddOfficeHour = async () => {
        if (!staffProfile) return;

        const updated = [...officeHours, { ...newOfficeHour, id: Date.now() }];

        try {
            await staffService.updateOfficeHours(staffProfile.id, updated);
            setOfficeHours(updated);
            setNewOfficeHour({ day: "Monday", start: "09:00", end: "11:00" });
            setShowAddOfficeHour(false);
        } catch (err) {
            console.error("Error saving office hours:", err);
            alert("Failed to save. Please try again.");
        }
    };

    const deleteOfficeHour = async (id) => {
        if (!staffProfile) return;

        const updated = officeHours.filter(oh => oh.id !== id);

        try {
            await staffService.updateOfficeHours(staffProfile.id, updated);
            setOfficeHours(updated);
        } catch (err) {
            console.error("Error deleting:", err);
        }
    };

    // ================= LEAVE REQUESTS =================
    const handleSubmitLeaveRequest = async () => {
        if (!staffProfile || !newLeaveRequest.startDate || !newLeaveRequest.endDate) {
            alert("Please fill in all required fields");
            return;
        }

        try {
            const res = await staffService.createLeaveRequest(staffProfile.id, newLeaveRequest);
            if (res.status === "success") {
                alert("Leave request submitted successfully!");
                setShowLeaveForm(false);
                setNewLeaveRequest({ leaveType: "annual", startDate: "", endDate: "", reason: "" });
                // Reload leave requests
                const lrRes = await staffService.getLeaveRequests(staffProfile.id);
                if (lrRes.status === "success") {
                    setLeaveRequests(lrRes.data || []);
                }
            } else {
                alert(res.message || "Failed to submit leave request");
            }
        } catch (err) {
            console.error("Error submitting leave request:", err);
            alert("Failed to submit. Please try again.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/login");
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString();
    };

    const getStatusBadge = (status) => {
        const colors = {
            pending: { bg: "#fef3c7", color: "#92400e" },
            approved: { bg: "#d1fae5", color: "#065f46" },
            rejected: { bg: "#fee2e2", color: "#991b1b" }
        };
        const style = colors[status] || colors.pending;
        return (
            <span style={{
                padding: "4px 10px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: 500,
                backgroundColor: style.bg,
                color: style.color
            }}>
                {status?.toUpperCase() || "PENDING"}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="ta-page">
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                    <p>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="ta-page">
            {/* Sidebar */}
            <aside className="ta-sidebar">
                <h2 className="ta-logo">U-Manage</h2>
                <span className="ta-role-badge">Teaching Assistant</span>

                <nav className="ta-menu">
                    <button
                        className={`menu-item ${activeSection === "overview" ? "active" : ""}`}
                        onClick={() => setActiveSection("overview")}
                    >
                        📊 Overview
                    </button>
                    <button
                        className={`menu-item ${activeSection === "responsibilities" ? "active" : ""}`}
                        onClick={() => setActiveSection("responsibilities")}
                    >
                        ✅ My Tasks
                    </button>
                    <button
                        className={`menu-item ${activeSection === "office-hours" ? "active" : ""}`}
                        onClick={() => setActiveSection("office-hours")}
                    >
                        🕐 Office Hours
                    </button>
                    <button
                        className={`menu-item ${activeSection === "leave" ? "active" : ""}`}
                        onClick={() => setActiveSection("leave")}
                    >
                        📅 Leave Requests
                    </button>
                    <button
                        className={`menu-item ${activeSection === "profile" ? "active" : ""}`}
                        onClick={() => setActiveSection("profile")}
                    >
                        👤 My Profile
                    </button>
                </nav>

                <button className="logout-btn" onClick={handleLogout}>
                    🚪 Logout
                </button>
            </aside>

            {/* Main content */}
            <main className="ta-main">
                <header className="ta-header">
                    <div>
                        <h1>TA Dashboard</h1>
                        <p className="subtitle">
                            Welcome back, {staffProfile?.name || user?.username || "Teaching Assistant"}!
                        </p>
                        {error && <p className="error-text">{error}</p>}
                    </div>

                    <div className="header-right">
                        <div className="ta-user">
                            <div className="avatar">TA</div>
                            <div>
                                <p className="user-name">{staffProfile?.name || user?.username || "TA"}</p>
                                <p className="user-role">{staffProfile?.email || user?.email}</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Overview Section */}
                {activeSection === "overview" && (
                    <>
                        <section className="cards-grid">
                            <div className="card">
                                <p className="card-label">Pending Tasks</p>
                                <h2 className="card-value">
                                    {responsibilities.filter(r => !r.completed).length}
                                </h2>
                                <p className="card-sub">Tasks to complete</p>
                            </div>

                            <div className="card">
                                <p className="card-label">Completed Tasks</p>
                                <h2 className="card-value">
                                    {responsibilities.filter(r => r.completed).length}
                                </h2>
                                <p className="card-sub">Tasks finished</p>
                            </div>

                            <div className="card">
                                <p className="card-label">Office Hours</p>
                                <h2 className="card-value">{officeHours.length}</h2>
                                <p className="card-sub">Scheduled slots</p>
                            </div>

                            <div className="card">
                                <p className="card-label">Leave Balance</p>
                                <h2 className="card-value">{leaveBalance}</h2>
                                <p className="card-sub">Days remaining</p>
                            </div>
                        </section>

                        <section className="bottom-grid">
                            <div className="panel">
                                <h3>Quick Actions</h3>
                                <div className="quick-actions">
                                    <button className="quick-btn" onClick={() => setActiveSection("responsibilities")}>
                                        + Add Task
                                    </button>
                                    <button className="quick-btn" onClick={() => setActiveSection("office-hours")}>
                                        + Office Hours
                                    </button>
                                    <button className="quick-btn" onClick={() => { setActiveSection("leave"); setShowLeaveForm(true); }}>
                                        + Request Leave
                                    </button>
                                </div>
                            </div>

                            <div className="panel">
                                <h3>Upcoming Tasks</h3>
                                <ul className="task-list">
                                    {responsibilities.filter(r => !r.completed).slice(0, 5).map(r => (
                                        <li key={r.id} className="task-item">
                                            <span>{r.text}</span>
                                        </li>
                                    ))}
                                    {responsibilities.filter(r => !r.completed).length === 0 && (
                                        <li className="task-item empty">No pending tasks</li>
                                    )}
                                </ul>
                            </div>
                        </section>
                    </>
                )}

                {/* Responsibilities Section */}
                {activeSection === "responsibilities" && (
                    <section className="content-section">
                        <div className="section-header">
                            <h2>My Tasks & Responsibilities</h2>
                            <button className="add-btn" onClick={() => setShowAddResponsibility(true)}>
                                + Add Task
                            </button>
                        </div>

                        <div className="responsibilities-list">
                            {responsibilities.map(r => (
                                <div key={r.id} className={`responsibility-item ${r.completed ? "completed" : ""}`}>
                                    <input
                                        type="checkbox"
                                        checked={r.completed}
                                        onChange={() => toggleResponsibility(r.id)}
                                    />
                                    <span className="responsibility-text">{r.text}</span>
                                    <button className="delete-btn" onClick={() => deleteResponsibility(r.id)}>
                                        ✕
                                    </button>
                                </div>
                            ))}
                            {responsibilities.length === 0 && (
                                <p className="empty-message">No tasks yet. Add your first task!</p>
                            )}
                        </div>

                        {showAddResponsibility && (
                            <div className="modal-overlay">
                                <div className="modal">
                                    <h3>Add New Task</h3>
                                    <input
                                        type="text"
                                        placeholder="Enter task description..."
                                        value={newResponsibility}
                                        onChange={(e) => setNewResponsibility(e.target.value)}
                                        className="modal-input"
                                    />
                                    <div className="modal-actions">
                                        <button onClick={() => setShowAddResponsibility(false)}>Cancel</button>
                                        <button className="primary" onClick={handleAddResponsibility}>Add</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* Office Hours Section */}
                {activeSection === "office-hours" && (
                    <section className="content-section">
                        <div className="section-header">
                            <h2>Office Hours</h2>
                            <button className="add-btn" onClick={() => setShowAddOfficeHour(true)}>
                                + Add Slot
                            </button>
                        </div>

                        <div className="office-hours-list">
                            {officeHours.map(oh => (
                                <div key={oh.id} className="office-hour-item">
                                    <div className="oh-day">{oh.day}</div>
                                    <div className="oh-time">{oh.start} - {oh.end}</div>
                                    <button className="delete-btn" onClick={() => deleteOfficeHour(oh.id)}>
                                        ✕
                                    </button>
                                </div>
                            ))}
                            {officeHours.length === 0 && (
                                <p className="empty-message">No office hours scheduled. Add your first slot!</p>
                            )}
                        </div>

                        {showAddOfficeHour && (
                            <div className="modal-overlay">
                                <div className="modal">
                                    <h3>Add Office Hours</h3>
                                    <div className="form-group">
                                        <label>Day</label>
                                        <select
                                            value={newOfficeHour.day}
                                            onChange={(e) => setNewOfficeHour({ ...newOfficeHour, day: e.target.value })}
                                        >
                                            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Start Time</label>
                                            <input
                                                type="time"
                                                value={newOfficeHour.start}
                                                onChange={(e) => setNewOfficeHour({ ...newOfficeHour, start: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>End Time</label>
                                            <input
                                                type="time"
                                                value={newOfficeHour.end}
                                                onChange={(e) => setNewOfficeHour({ ...newOfficeHour, end: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="modal-actions">
                                        <button onClick={() => setShowAddOfficeHour(false)}>Cancel</button>
                                        <button className="primary" onClick={handleAddOfficeHour}>Add</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* Leave Requests Section */}
                {activeSection === "leave" && (
                    <section className="content-section">
                        <div className="section-header">
                            <h2>Leave Requests</h2>
                            <button className="add-btn" onClick={() => setShowLeaveForm(true)}>
                                + Request Leave
                            </button>
                        </div>

                        <div className="leave-info">
                            <div className="leave-balance-card">
                                <h3>Available Leave Balance</h3>
                                <div className="balance-number">{leaveBalance}</div>
                                <p>days remaining this year</p>
                            </div>
                        </div>

                        <h3 style={{ marginTop: 20 }}>Your Leave Requests</h3>
                        <div className="leave-requests-list">
                            {leaveRequests.length > 0 ? (
                                <table className="leave-table">
                                    <thead>
                                        <tr>
                                            <th>Type</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                            <th>Status</th>
                                            <th>Submitted</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaveRequests.map(lr => (
                                            <tr key={lr.request_id}>
                                                <td style={{ textTransform: "capitalize" }}>{lr.leave_type}</td>
                                                <td>{formatDate(lr.start_date)}</td>
                                                <td>{formatDate(lr.end_date)}</td>
                                                <td>{getStatusBadge(lr.status)}</td>
                                                <td>{formatDate(lr.created_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="empty-message">No leave requests submitted yet.</p>
                            )}
                        </div>

                        {showLeaveForm && (
                            <div className="modal-overlay">
                                <div className="modal">
                                    <h3>Request Leave</h3>
                                    <div className="form-group">
                                        <label>Leave Type</label>
                                        <select
                                            value={newLeaveRequest.leaveType}
                                            onChange={(e) => setNewLeaveRequest({ ...newLeaveRequest, leaveType: e.target.value })}
                                        >
                                            <option value="annual">Annual Leave</option>
                                            <option value="sick">Sick Leave</option>
                                            <option value="maternity">Maternity Leave</option>
                                            <option value="paternity">Paternity Leave</option>
                                            <option value="unpaid">Unpaid Leave</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Start Date</label>
                                            <input
                                                type="date"
                                                value={newLeaveRequest.startDate}
                                                onChange={(e) => setNewLeaveRequest({ ...newLeaveRequest, startDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>End Date</label>
                                            <input
                                                type="date"
                                                value={newLeaveRequest.endDate}
                                                onChange={(e) => setNewLeaveRequest({ ...newLeaveRequest, endDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Reason (Optional)</label>
                                        <textarea
                                            placeholder="Reason for leave..."
                                            value={newLeaveRequest.reason}
                                            onChange={(e) => setNewLeaveRequest({ ...newLeaveRequest, reason: e.target.value })}
                                            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", minHeight: 80 }}
                                        />
                                    </div>
                                    <div className="modal-actions">
                                        <button onClick={() => setShowLeaveForm(false)}>Cancel</button>
                                        <button className="primary" onClick={handleSubmitLeaveRequest}>Submit Request</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* Profile Section */}
                {activeSection === "profile" && (
                    <section className="content-section">
                        <div className="section-header">
                            <h2>My Profile</h2>
                        </div>

                        {staffProfile ? (
                            <div className="profile-grid">
                                <div className="profile-card">
                                    <h3>Personal Information</h3>
                                    <div className="profile-field">
                                        <label>Name</label>
                                        <p>{staffProfile.name || "N/A"}</p>
                                    </div>
                                    <div className="profile-field">
                                        <label>Email</label>
                                        <p>{staffProfile.email || "N/A"}</p>
                                    </div>
                                    <div className="profile-field">
                                        <label>Phone</label>
                                        <p>{staffProfile.phone || "Not set"}</p>
                                    </div>
                                    <div className="profile-field">
                                        <label>Department</label>
                                        <p>{staffProfile.department || "Not set"}</p>
                                    </div>
                                    <div className="profile-field">
                                        <label>Office Location</label>
                                        <p>{staffProfile.office_location || "Not set"}</p>
                                    </div>
                                </div>

                                <div className="profile-card">
                                    <h3>Employment Details</h3>
                                    <div className="profile-field">
                                        <label>Staff Type</label>
                                        <p style={{ textTransform: "capitalize" }}>{staffProfile.staffType || "TA"}</p>
                                    </div>
                                    <div className="profile-field">
                                        <label>Staff ID</label>
                                        <p>#{staffProfile.id}</p>
                                    </div>
                                    <div className="profile-field">
                                        <label>Leave Balance</label>
                                        <p>{leaveBalance} days</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="empty-message">Profile information not available.</p>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
}

export default TADashboard;
