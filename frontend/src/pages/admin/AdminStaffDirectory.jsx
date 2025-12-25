import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import adminStaffService from "../../services/adminStaffService";
import socketService from "../../services/socketService";
import TemporaryPasswordModal from "../../components/TemporaryPasswordModal";
import AdminSidebar from "../../components/AdminSidebar";
import "./dashboard.css";

// Role badge colors
const ROLE_COLORS = {
    doctor: { bg: "#dbeafe", color: "#1e40af", label: "Doctor" },
    ta: { bg: "#fef3c7", color: "#92400e", label: "Teaching Assistant" },
    advisor: { bg: "#d1fae5", color: "#065f46", label: "Advisor" },
    professor: { bg: "#e0e7ff", color: "#3730a3", label: "Professor" },
};

// Status badge colors
const STATUS_COLORS = {
    active: { bg: "#d1fae5", color: "#065f46", label: "Active" },
    inactive: { bg: "#fee2e2", color: "#991b1b", label: "Inactive" },
    pending: { bg: "#fef3c7", color: "#92400e", label: "Pending" },
};

function RoleBadge({ role }) {
    const config = ROLE_COLORS[role?.toLowerCase()] || { bg: "#e5e7eb", color: "#374151", label: role };
    return (
        <span
            style={{
                display: "inline-block",
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                backgroundColor: config.bg,
                color: config.color,
                marginRight: 4,
            }}
        >
            {config.label}
        </span>
    );
}

function StatusBadge({ status }) {
    const config = STATUS_COLORS[status?.toLowerCase()] || STATUS_COLORS.active;
    return (
        <span
            style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: config.bg,
                color: config.color,
            }}
        >
            {config.label}
        </span>
    );
}

// Toast notification component
function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === "error" ? "#fee2e2" : type === "success" ? "#d1fae5" : type === "warning" ? "#fef3c7" : "#e0e7ff";
    const textColor = type === "error" ? "#991b1b" : type === "success" ? "#065f46" : type === "warning" ? "#92400e" : "#3730a3";

    return (
        <div
            style={{
                position: "fixed",
                top: 20,
                right: 20,
                padding: "12px 20px",
                borderRadius: 8,
                backgroundColor: bgColor,
                color: textColor,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                gap: 12,
            }}
        >
            <span>{message}</span>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: textColor }}>×</button>
        </div>
    );
}

// Confirmation modal
function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", isDestructive = false }) {
    if (!isOpen) return null;

    return (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9998 }} onClick={onCancel}>
            <div style={{ backgroundColor: "white", borderRadius: 12, padding: 24, maxWidth: 400, width: "90%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ margin: "0 0 12px", fontSize: 18 }}>{title}</h3>
                <p style={{ margin: "0 0 20px", color: "#6b7280" }}>{message}</p>
                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                    <button onClick={onCancel} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #d1d5db", background: "white", cursor: "pointer" }}>Cancel</button>
                    <button onClick={onConfirm} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: isDestructive ? "#dc2626" : "#2563eb", color: "white", cursor: "pointer" }}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
}

// Staff form modal (create/edit)
function StaffFormModal({ isOpen, staff, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "doctor",
        roles: ["doctor"],
        department: "",
        officeLocation: "",
        phone: "",
        status: "active",
        specialization: "",
    });

    useEffect(() => {
        if (staff) {
            setFormData({
                name: staff.name || "",
                email: staff.email || "",
                role: staff.role || "doctor",
                roles: staff.roles || [staff.role || "doctor"],
                department: staff.department || "",
                officeLocation: staff.officeLocation || "",
                phone: staff.phone || "",
                status: staff.status || "active",
                specialization: staff.specialization || "",
            });
        } else {
            setFormData({
                name: "",
                email: "",
                role: "doctor",
                roles: ["doctor"],
                department: "",
                officeLocation: "",
                phone: "",
                status: "active",
                specialization: "",
            });
        }
    }, [staff, isOpen]);

    const handleRoleToggle = (role) => {
        setFormData((prev) => {
            const newRoles = prev.roles.includes(role)
                ? prev.roles.filter((r) => r !== role)
                : [...prev.roles, role];
            return {
                ...prev,
                roles: newRoles.length > 0 ? newRoles : ["doctor"],
                role: newRoles[0] || "doctor",
            };
        });
    };

    if (!isOpen) return null;

    return (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9998 }} onClick={onCancel}>
            <div style={{ backgroundColor: "white", borderRadius: 12, padding: 24, maxWidth: 550, width: "95%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ margin: "0 0 20px", fontSize: 18 }}>{staff ? "Edit Staff Member" : "Add New Staff Member"}</h3>

                <div style={{ display: "grid", gap: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                            <label style={{ fontSize: 13, color: "#374151", display: "block", marginBottom: 4 }}>Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #d1d5db" }}
                                placeholder="Dr. John Smith"
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, color: "#374151", display: "block", marginBottom: 4 }}>Email *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #d1d5db" }}
                                placeholder="john.smith@university.edu"
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: 13, color: "#374151", display: "block", marginBottom: 8 }}>Roles *</label>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {["doctor", "ta", "advisor", "professor"].map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => handleRoleToggle(role)}
                                    style={{
                                        padding: "8px 16px",
                                        borderRadius: 6,
                                        border: formData.roles.includes(role) ? "2px solid #2563eb" : "1px solid #d1d5db",
                                        background: formData.roles.includes(role) ? "#dbeafe" : "white",
                                        color: formData.roles.includes(role) ? "#1e40af" : "#374151",
                                        cursor: "pointer",
                                        fontWeight: formData.roles.includes(role) ? 600 : 400,
                                    }}
                                >
                                    {ROLE_COLORS[role]?.label || role}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                            <label style={{ fontSize: 13, color: "#374151", display: "block", marginBottom: 4 }}>Department</label>
                            <input
                                type="text"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #d1d5db" }}
                                placeholder="Computer Science"
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, color: "#374151", display: "block", marginBottom: 4 }}>Office Location</label>
                            <input
                                type="text"
                                value={formData.officeLocation}
                                onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
                                style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #d1d5db" }}
                                placeholder="Building A, Room 204"
                            />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                            <label style={{ fontSize: 13, color: "#374151", display: "block", marginBottom: 4 }}>Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #d1d5db" }}
                                placeholder="+1 234 567 8900"
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, color: "#374151", display: "block", marginBottom: 4 }}>Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #d1d5db" }}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: 13, color: "#374151", display: "block", marginBottom: 4 }}>Specialization</label>
                        <input
                            type="text"
                            value={formData.specialization}
                            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                            style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #d1d5db" }}
                            placeholder="Machine Learning, Data Science"
                        />
                    </div>
                </div>

                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
                    <button onClick={onCancel} style={{ padding: "10px 20px", borderRadius: 6, border: "1px solid #d1d5db", background: "white", cursor: "pointer" }}>Cancel</button>
                    <button
                        onClick={() => onSave(formData)}
                        disabled={!formData.name || !formData.email}
                        style={{
                            padding: "10px 20px",
                            borderRadius: 6,
                            border: "none",
                            background: formData.name && formData.email ? "#2563eb" : "#d1d5db",
                            color: "white",
                            cursor: formData.name && formData.email ? "pointer" : "not-allowed",
                        }}
                    >
                        {staff ? "Save Changes" : "Add Staff"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Detail modal
function DetailModal({ isOpen, staff, onClose }) {
    if (!isOpen || !staff) return null;

    return (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9998 }} onClick={onClose}>
            <div style={{ backgroundColor: "white", borderRadius: 12, padding: 24, maxWidth: 500, width: "90%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 18 }}>Staff Details</h3>
                    <StatusBadge status={staff.status} />
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                    <div>
                        <label style={{ fontSize: 12, color: "#6b7280", display: "block" }}>Name</label>
                        <p style={{ margin: "4px 0", fontWeight: 500 }}>{staff.name}</p>
                    </div>
                    <div>
                        <label style={{ fontSize: 12, color: "#6b7280", display: "block" }}>Email</label>
                        <p style={{ margin: "4px 0" }}>{staff.email}</p>
                    </div>
                    <div>
                        <label style={{ fontSize: 12, color: "#6b7280", display: "block" }}>Roles</label>
                        <div style={{ marginTop: 4 }}>
                            {staff.roles?.map((role) => <RoleBadge key={role} role={role} />)}
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: 12, color: "#6b7280", display: "block" }}>Department</label>
                        <p style={{ margin: "4px 0" }}>{staff.department || "N/A"}</p>
                    </div>
                    <div>
                        <label style={{ fontSize: 12, color: "#6b7280", display: "block" }}>Office Location</label>
                        <p style={{ margin: "4px 0" }}>{staff.officeLocation || "N/A"}</p>
                    </div>
                    <div>
                        <label style={{ fontSize: 12, color: "#6b7280", display: "block" }}>Phone</label>
                        <p style={{ margin: "4px 0" }}>{staff.phone || "N/A"}</p>
                    </div>
                    <div>
                        <label style={{ fontSize: 12, color: "#6b7280", display: "block" }}>Specialization</label>
                        <p style={{ margin: "4px 0" }}>{staff.specialization || "N/A"}</p>
                    </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                    <button onClick={onClose} style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: "#2563eb", color: "white", cursor: "pointer" }}>Close</button>
                </div>
            </div>
        </div>
    );
}

function AdminStaffDirectory() {
    const navigate = useNavigate();

    // Data state
    const [staffList, setStaffList] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [stats, setStats] = useState({ total: 0, byRole: {}, byStatus: {} });

    // Filter state
    const [roleFilter, setRoleFilter] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    // UI state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toast, setToast] = useState(null);

    // Modal state
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [showTempPasswordModal, setShowTempPasswordModal] = useState(false);
    const [tempPasswordData, setTempPasswordData] = useState({ name: '', password: '' });
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const showToast = (message, type = "info") => {
        setToast({ message, type });
    };

    const loadStaff = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await adminStaffService.getStaff({
                role: roleFilter,
                department: departmentFilter,
                status: statusFilter,
                search: searchQuery,
            });
            setStaffList(res.data?.staff || []);
        } catch (err) {
            console.error("Error loading staff:", err);
            setError("Failed to load staff");
            showToast("Failed to load staff", "error");
        } finally {
            setLoading(false);
        }
    }, [roleFilter, departmentFilter, statusFilter, searchQuery]);

    const loadDepartments = async () => {
        try {
            const res = await adminStaffService.getDepartments();
            setDepartments(res.data?.departments || []);
        } catch (err) {
            console.error("Error loading departments:", err);
        }
    };

    const loadStats = async () => {
        try {
            const res = await adminStaffService.getStats();
            setStats(res.data || { total: 0, byRole: {}, byStatus: {} });
        } catch (err) {
            console.error("Error loading stats:", err);
        }
    };

    useEffect(() => {
        loadDepartments();
        loadStats();
    }, []);

    useEffect(() => {
        loadStaff();
    }, [loadStaff]);

    // Socket.io real-time updates
    useEffect(() => {
        socketService.connect();
        socketService.joinRoom("admin");

        const handleStaffCreated = () => {
            showToast("New staff member added!", "info");
            loadStaff();
            loadStats();
        };

        const handleStaffUpdated = () => {
            loadStaff();
            loadStats();
        };

        const handleStaffDeleted = () => {
            showToast("Staff member removed", "warning");
            loadStaff();
            loadStats();
        };

        socketService.on("staff-created", handleStaffCreated);
        socketService.on("staff-updated", handleStaffUpdated);
        socketService.on("staff-status-changed", handleStaffUpdated);
        socketService.on("staff-deleted", handleStaffDeleted);

        return () => {
            socketService.off("staff-created", handleStaffCreated);
            socketService.off("staff-updated", handleStaffUpdated);
            socketService.off("staff-status-changed", handleStaffUpdated);
            socketService.off("staff-deleted", handleStaffDeleted);
        };
    }, [loadStaff]);

    // Handlers
    const handleCreateStaff = async (formData) => {
        try {
            // First create the staff profile
            await adminStaffService.createStaff(formData);

            // Then create the user account with auth (returns temp password)
            try {
                const authResult = await adminStaffService.createStaffAccount({
                    email: formData.email,
                    username: formData.name,
                    userType: formData.roles?.[0] || formData.role || 'doctor',
                    department: formData.department,
                    specialization: formData.specialization
                });

                if (authResult?.temporaryPassword) {
                    setTempPasswordData({
                        name: formData.name,
                        password: authResult.temporaryPassword
                    });
                    setShowTempPasswordModal(true);
                }
            } catch (authErr) {
                // Auth account may already exist or other issue
                console.log("Staff profile created but auth account creation skipped:", authErr.response?.data?.message);
            }

            showToast("Staff member added successfully", "success");
            setShowFormModal(false);
            loadStaff();
            loadStats();
        } catch (err) {
            console.error("Error creating staff:", err);
            showToast(err.response?.data?.message || "Failed to add staff member", "error");
        }
    };

    const handleUpdateStaff = async (formData) => {
        if (!selectedStaff) return;
        try {
            await adminStaffService.updateStaff(selectedStaff.id, formData);
            showToast("Staff member updated successfully", "success");
            setShowFormModal(false);
            setSelectedStaff(null);
            loadStaff();
        } catch (err) {
            console.error("Error updating staff:", err);
            showToast("Failed to update staff member", "error");
        }
    };

    const handleToggleStatus = async (staff) => {
        try {
            await adminStaffService.toggleStaffStatus(staff.id);
            showToast(`Staff ${staff.status === "active" ? "deactivated" : "activated"} successfully`, "success");
            loadStaff();
            loadStats();
        } catch (err) {
            console.error("Error toggling status:", err);
            showToast("Failed to update status", "error");
        }
    };

    const handleResetPassword = async (staff) => {
        try {
            const result = await adminStaffService.resetStaffPassword(staff.id);
            if (result?.temporaryPassword) {
                setTempPasswordData({
                    name: staff.name,
                    password: result.temporaryPassword
                });
                setShowTempPasswordModal(true);
                showToast(`Password reset for ${staff.name}`, "success");
            } else {
                showToast("Password reset completed", "success");
            }
        } catch (err) {
            console.error("Error resetting password:", err);
            showToast(err.response?.data?.message || "Failed to reset password", "error");
        }
    };

    const handleDeleteStaff = async () => {
        if (!selectedStaff) return;
        try {
            await adminStaffService.deleteStaff(selectedStaff.id);
            showToast("Staff member deleted successfully", "success");
            setShowDeleteModal(false);
            setSelectedStaff(null);
            loadStaff();
            loadStats();
        } catch (err) {
            console.error("Error deleting staff:", err);
            showToast("Failed to delete staff member", "error");
        }
    };

    return (
        <div className="admin-page">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <AdminSidebar />

            {/* Main content */}
            <main className="admin-main">
                <header className="admin-header">
                    <div>
                        <h1>Staff Directory</h1>
                        <p className="subtitle">Manage all academic staff members, assign roles, and update profiles.</p>
                        {error && <p style={{ color: "red", marginTop: 4, fontSize: 13 }}>{error}</p>}
                    </div>
                    <div className="header-right">
                        <button
                            onClick={() => { setSelectedStaff(null); setShowFormModal(true); }}
                            style={{
                                padding: "10px 20px",
                                borderRadius: 8,
                                border: "none",
                                background: "#2563eb",
                                color: "white",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                fontWeight: 500,
                            }}
                        >
                            <span style={{ fontSize: 18 }}>+</span>
                            Add Staff
                        </button>
                    </div>
                </header>

                {/* Stats Cards */}
                <section style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                    <div style={{ background: "white", borderRadius: 10, padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderLeft: "4px solid #6366f1", display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>Total Staff</p>
                            <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1f2937" }}>{loading ? "…" : stats.total}</h3>
                        </div>
                    </div>

                    <div style={{ background: "white", borderRadius: 10, padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderLeft: "4px solid #1e40af", display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                            </svg>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>Doctors</p>
                            <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1e40af" }}>{loading ? "…" : (stats.byRole?.doctor || 0)}</h3>
                        </div>
                    </div>

                    <div style={{ background: "white", borderRadius: 10, padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderLeft: "4px solid #f59e0b", display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>TAs</p>
                            <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#f59e0b" }}>{loading ? "…" : (stats.byRole?.ta || 0)}</h3>
                        </div>
                    </div>

                    <div style={{ background: "white", borderRadius: 10, padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderLeft: "4px solid #10b981", display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>Active</p>
                            <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#10b981" }}>{loading ? "…" : (stats.byStatus?.active || 0)}</h3>
                        </div>
                    </div>
                </section>

                {/* Filters */}
                <section className="panel" style={{ marginBottom: 24 }}>
                    <h3>Filters</h3>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
                        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", minWidth: 140 }}>
                            <option value="">All Roles</option>
                            <option value="doctor">Doctor</option>
                            <option value="ta">Teaching Assistant</option>
                            <option value="advisor">Advisor</option>
                            <option value="professor">Professor</option>
                        </select>

                        <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", minWidth: 160 }}>
                            <option value="">All Departments</option>
                            {departments.map((dept) => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>

                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", minWidth: 120 }}>
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="pending">Pending</option>
                        </select>

                        <input
                            type="search"
                            placeholder="Search by name, email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", flex: 1, minWidth: 200 }}
                        />

                        <button onClick={loadStaff} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#2563eb", color: "white", cursor: "pointer" }}>Refresh</button>
                    </div>
                </section>

                {/* Staff Table */}
                <section className="panel">
                    <h3>Staff Members</h3>

                    {loading && <p style={{ padding: 20 }}>Loading staff...</p>}

                    {!loading && staffList.length === 0 && (
                        <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                            <p style={{ fontSize: 16, marginBottom: 8 }}>No staff members found</p>
                            <p style={{ fontSize: 13 }}>Add your first staff member using the button above.</p>
                        </div>
                    )}

                    {!loading && staffList.length > 0 && (
                        <div style={{ overflowX: "auto" }}>
                            <table className="activity-table" style={{ minWidth: 900 }}>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Roles</th>
                                        <th>Department</th>
                                        <th>Office</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staffList.map((staff) => (
                                        <tr key={staff.id}>
                                            <td style={{ fontWeight: 500 }}>{staff.name}</td>
                                            <td>{staff.email}</td>
                                            <td>
                                                {staff.roles?.map((role) => <RoleBadge key={role} role={role} />)}
                                            </td>
                                            <td>{staff.department || "N/A"}</td>
                                            <td>{staff.officeLocation || "N/A"}</td>
                                            <td><StatusBadge status={staff.status} /></td>
                                            <td>
                                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                    <button
                                                        onClick={() => { setSelectedStaff(staff); setShowDetailModal(true); }}
                                                        style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #d1d5db", background: "white", cursor: "pointer", fontSize: 12 }}
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedStaff(staff); setShowFormModal(true); }}
                                                        style={{ padding: "4px 8px", borderRadius: 4, border: "none", background: "#7c3aed", color: "white", cursor: "pointer", fontSize: 12 }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(staff)}
                                                        style={{
                                                            padding: "4px 8px",
                                                            borderRadius: 4,
                                                            border: "none",
                                                            background: staff.status === "active" ? "#f59e0b" : "#10b981",
                                                            color: "white",
                                                            cursor: "pointer",
                                                            fontSize: 12,
                                                        }}
                                                    >
                                                        {staff.status === "active" ? "Deactivate" : "Activate"}
                                                    </button>
                                                    <button
                                                        onClick={() => handleResetPassword(staff)}
                                                        style={{ padding: "4px 8px", borderRadius: 4, border: "none", background: "#6366f1", color: "white", cursor: "pointer", fontSize: 12 }}
                                                        title="Reset password"
                                                    >
                                                        🔑
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedStaff(staff); setShowDeleteModal(true); }}
                                                        style={{ padding: "4px 8px", borderRadius: 4, border: "none", background: "#ef4444", color: "white", cursor: "pointer", fontSize: 12 }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>

            {/* Modals */}
            <DetailModal
                isOpen={showDetailModal}
                staff={selectedStaff}
                onClose={() => { setShowDetailModal(false); setSelectedStaff(null); }}
            />

            <StaffFormModal
                isOpen={showFormModal}
                staff={selectedStaff}
                onSave={selectedStaff ? handleUpdateStaff : handleCreateStaff}
                onCancel={() => { setShowFormModal(false); setSelectedStaff(null); }}
            />

            <ConfirmModal
                isOpen={showDeleteModal}
                title="Delete Staff Member"
                message={`Are you sure you want to delete ${selectedStaff?.name}? This action cannot be undone.`}
                confirmText="Delete"
                isDestructive
                onConfirm={handleDeleteStaff}
                onCancel={() => { setShowDeleteModal(false); setSelectedStaff(null); }}
            />

            <TemporaryPasswordModal
                isOpen={showTempPasswordModal}
                staffName={tempPasswordData.name}
                temporaryPassword={tempPasswordData.password}
                onClose={() => setShowTempPasswordModal(false)}
            />
        </div>
    );
}

export default AdminStaffDirectory;
