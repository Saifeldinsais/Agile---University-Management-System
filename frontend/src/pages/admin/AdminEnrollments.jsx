import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import adminEnrollmentsService from "../../services/adminEnrollmentsService";
import socketService from "../../services/socketService";
import "./dashboard.css";

// Status badge colors
const STATUS_COLORS = {
    PENDING: { bg: "#fef3c7", color: "#92400e", label: "Pending" },
    APPROVED: { bg: "#d1fae5", color: "#065f46", label: "Approved" },
    REJECTED: { bg: "#fee2e2", color: "#991b1b", label: "Rejected" },
    CANCELLED: { bg: "#e5e7eb", color: "#374151", label: "Cancelled" },
    DROP: { bg: "#fed7aa", color: "#c2410c", label: "Dropped" },
};

function StatusBadge({ status }) {
    const config = STATUS_COLORS[status?.toUpperCase()] || STATUS_COLORS.PENDING;
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
            <button
                onClick={onClose}
                style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 16,
                    color: textColor,
                }}
            >
                ×
            </button>
        </div>
    );
}

// Confirmation modal component
function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", isDestructive = false }) {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9998,
            }}
            onClick={onCancel}
        >
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: 12,
                    padding: 24,
                    maxWidth: 400,
                    width: "90%",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 style={{ margin: "0 0 12px", fontSize: 18 }}>{title}</h3>
                <p style={{ margin: "0 0 20px", color: "#6b7280" }}>{message}</p>
                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: "8px 16px",
                            borderRadius: 6,
                            border: "1px solid #d1d5db",
                            background: "white",
                            cursor: "pointer",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: "8px 16px",
                            borderRadius: 6,
                            border: "none",
                            background: isDestructive ? "#dc2626" : "#2563eb",
                            color: "white",
                            cursor: "pointer",
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Rejection modal with reason input
function RejectModal({ isOpen, onConfirm, onCancel }) {
    const [reason, setReason] = useState("");

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9998,
            }}
            onClick={onCancel}
        >
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: 12,
                    padding: 24,
                    maxWidth: 450,
                    width: "90%",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 style={{ margin: "0 0 12px", fontSize: 18 }}>Reject Enrollment Request</h3>
                <p style={{ margin: "0 0 12px", color: "#6b7280" }}>
                    Please provide a reason for rejection:
                </p>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter rejection reason..."
                    style={{
                        width: "100%",
                        minHeight: 100,
                        padding: 12,
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        resize: "vertical",
                        marginBottom: 16,
                    }}
                />
                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: "8px 16px",
                            borderRadius: 6,
                            border: "1px solid #d1d5db",
                            background: "white",
                            cursor: "pointer",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(reason)}
                        disabled={!reason.trim()}
                        style={{
                            padding: "8px 16px",
                            borderRadius: 6,
                            border: "none",
                            background: reason.trim() ? "#dc2626" : "#d1d5db",
                            color: "white",
                            cursor: reason.trim() ? "pointer" : "not-allowed",
                        }}
                    >
                        Reject
                    </button>
                </div>
            </div>
        </div>
    );
}

// Assign advisor modal
function AssignAdvisorModal({ isOpen, enrollment, advisors, onConfirm, onCancel }) {
    const [selectedAdvisorId, setSelectedAdvisorId] = useState("");

    useEffect(() => {
        if (enrollment?.advisor?.id) {
            setSelectedAdvisorId(enrollment.advisor.id.toString());
        } else {
            setSelectedAdvisorId("");
        }
    }, [enrollment]);

    if (!isOpen || !enrollment) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9998,
            }}
            onClick={onCancel}
        >
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: 12,
                    padding: 24,
                    maxWidth: 450,
                    width: "90%",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 style={{ margin: "0 0 12px", fontSize: 18 }}>Assign Advisor</h3>
                <p style={{ margin: "0 0 16px", color: "#6b7280" }}>
                    Assign an advisor for <strong>{enrollment.studentName}</strong>'s enrollment in{" "}
                    <strong>{enrollment.courseCode}</strong>
                </p>
                <select
                    value={selectedAdvisorId}
                    onChange={(e) => setSelectedAdvisorId(e.target.value)}
                    style={{
                        width: "100%",
                        padding: 10,
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        marginBottom: 16,
                    }}
                >
                    <option value="">Select an advisor...</option>
                    {advisors.map((adv) => (
                        <option key={adv.id} value={adv.id}>
                            {adv.name || adv.email} {adv.department ? `(${adv.department})` : ""}
                        </option>
                    ))}
                </select>
                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: "8px 16px",
                            borderRadius: 6,
                            border: "1px solid #d1d5db",
                            background: "white",
                            cursor: "pointer",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(selectedAdvisorId)}
                        disabled={!selectedAdvisorId}
                        style={{
                            padding: "8px 16px",
                            borderRadius: 6,
                            border: "none",
                            background: selectedAdvisorId ? "#2563eb" : "#d1d5db",
                            color: "white",
                            cursor: selectedAdvisorId ? "pointer" : "not-allowed",
                        }}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

// Detail modal
function DetailModal({ isOpen, enrollment, onClose }) {
    if (!isOpen || !enrollment) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9998,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: 12,
                    padding: 24,
                    maxWidth: 500,
                    width: "90%",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 18 }}>Enrollment Details</h3>
                    <StatusBadge status={enrollment.status} />
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                    <div>
                        <label style={{ fontSize: 12, color: "#6b7280", display: "block" }}>Student</label>
                        <p style={{ margin: "4px 0", fontWeight: 500 }}>
                            {enrollment.studentName}
                            {enrollment.studentEmail && (
                                <span style={{ color: "#6b7280", fontWeight: 400 }}> ({enrollment.studentEmail})</span>
                            )}
                        </p>
                    </div>

                    <div>
                        <label style={{ fontSize: 12, color: "#6b7280", display: "block" }}>Student ID</label>
                        <p style={{ margin: "4px 0" }}>{enrollment.studentId}</p>
                    </div>

                    <div>
                        <label style={{ fontSize: 12, color: "#6b7280", display: "block" }}>Course</label>
                        <p style={{ margin: "4px 0", fontWeight: 500 }}>
                            {enrollment.courseTitle} <span style={{ color: "#6b7280" }}>({enrollment.courseCode})</span>
                        </p>
                    </div>

                    <div>
                        <label style={{ fontSize: 12, color: "#6b7280", display: "block" }}>Department</label>
                        <p style={{ margin: "4px 0" }}>{enrollment.department || "N/A"}</p>
                    </div>

                    <div>
                        <label style={{ fontSize: 12, color: "#6b7280", display: "block" }}>Advisor</label>
                        <p style={{ margin: "4px 0" }}>
                            {enrollment.advisor ? (
                                <>
                                    {enrollment.advisor.name || enrollment.advisor.email}
                                </>
                            ) : (
                                <span style={{ color: "#f59e0b" }}>Unassigned</span>
                            )}
                        </p>
                    </div>

                    <div>
                        <label style={{ fontSize: 12, color: "#6b7280", display: "block" }}>Requested At</label>
                        <p style={{ margin: "4px 0" }}>
                            {new Date(enrollment.createdAt).toLocaleString()}
                        </p>
                    </div>

                    {enrollment.decisionNote && (
                        <div>
                            <label style={{ fontSize: 12, color: "#6b7280", display: "block" }}>Decision Note</label>
                            <p style={{ margin: "4px 0", padding: 8, background: "#f9fafb", borderRadius: 4 }}>
                                {enrollment.decisionNote}
                            </p>
                        </div>
                    )}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: "8px 20px",
                            borderRadius: 6,
                            border: "none",
                            background: "#2563eb",
                            color: "white",
                            cursor: "pointer",
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function AdminEnrollments() {
    const navigate = useNavigate();

    // Data state
    const [enrollments, setEnrollments] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [advisors, setAdvisors] = useState([]);

    // Filter state
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // UI state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toast, setToast] = useState(null);

    // Modal state
    const [selectedEnrollment, setSelectedEnrollment] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showAdvisorModal, setShowAdvisorModal] = useState(false);

    // Pending action for optimistic UI
    const [pendingAction, setPendingAction] = useState(null);
    const [staffMenuOpen, setStaffMenuOpen] = useState(false);

    const showToast = (message, type = "info") => {
        setToast({ message, type });
    };

    const loadEnrollments = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await adminEnrollmentsService.getEnrollments({
                status: statusFilter === "ALL" ? "" : statusFilter,
                department: departmentFilter,
                search: searchQuery,
            });

            setEnrollments(res.data?.enrollments || []);
        } catch (err) {
            console.error("Error loading enrollments:", err);
            setError("Failed to load enrollments");
            showToast("Failed to load enrollments", "error");
        } finally {
            setLoading(false);
        }
    }, [statusFilter, departmentFilter, searchQuery]);

    const loadDepartments = async () => {
        try {
            const res = await adminEnrollmentsService.getDepartments();
            setDepartments(res.data?.departments || []);
        } catch (err) {
            console.error("Error loading departments:", err);
        }
    };

    const loadAdvisors = async (department = null) => {
        try {
            const res = await adminEnrollmentsService.getAdvisors(department);
            setAdvisors(res.data?.advisors || []);
        } catch (err) {
            console.error("Error loading advisors:", err);
        }
    };

    useEffect(() => {
        loadDepartments();
        loadAdvisors();
    }, []);

    useEffect(() => {
        loadEnrollments();
    }, [loadEnrollments]);

    // Socket.io real-time updates
    useEffect(() => {
        // Connect to socket
        socketService.connect();

        // Join admin room
        socketService.joinRoom("admin");

        // Listen for new enrollments
        const handleEnrollmentCreated = (data) => {
            console.log("New enrollment created:", data);
            showToast("New enrollment request received!", "info");
            // Refetch to get complete data
            loadEnrollments();
        };

        // Listen for enrollment updates (approve/reject)
        const handleEnrollmentUpdated = (data) => {
            console.log("Enrollment updated:", data);
            // Update local state immediately
            setEnrollments((prev) =>
                prev.map((e) =>
                    e.id === data.enrollmentId
                        ? { ...e, status: data.status, decisionNote: data.note || e.decisionNote }
                        : e
                )
            );
            showToast(`Enrollment ${data.action.toLowerCase()}d`, "success");
        };

        // Listen for drop requests from students
        const handleDropRequested = (data) => {
            console.log("Drop request received:", data);
            showToast("Student requested to drop a course!", "warning");
            // Refetch to get complete data with updated status
            loadEnrollments();
        };

        socketService.on("enrollment-created", handleEnrollmentCreated);
        socketService.on("enrollment-updated", handleEnrollmentUpdated);
        socketService.on("enrollment-drop-requested", handleDropRequested);

        // Cleanup on unmount
        return () => {
            socketService.off("enrollment-created", handleEnrollmentCreated);
            socketService.off("enrollment-updated", handleEnrollmentUpdated);
            socketService.off("enrollment-drop-requested", handleDropRequested);
        };
    }, [loadEnrollments]);

    // Handle approve action
    const handleApprove = async () => {
        if (!selectedEnrollment) return;

        setPendingAction({ id: selectedEnrollment.id, action: "approve" });
        setShowApproveModal(false);

        // Optimistic update
        setEnrollments((prev) =>
            prev.map((e) =>
                e.id === selectedEnrollment.id ? { ...e, status: "APPROVED" } : e
            )
        );

        try {
            await adminEnrollmentsService.decideEnrollment(selectedEnrollment.id, "APPROVE");
            showToast("Enrollment approved successfully", "success");
            loadEnrollments(); // Refetch to sync
        } catch (err) {
            console.error("Error approving enrollment:", err);
            showToast("Failed to approve enrollment", "error");
            loadEnrollments(); // Revert
        } finally {
            setPendingAction(null);
            setSelectedEnrollment(null);
        }
    };

    // Handle reject action
    const handleReject = async (reason) => {
        if (!selectedEnrollment) return;

        setPendingAction({ id: selectedEnrollment.id, action: "reject" });
        setShowRejectModal(false);

        // Optimistic update
        setEnrollments((prev) =>
            prev.map((e) =>
                e.id === selectedEnrollment.id ? { ...e, status: "REJECTED", decisionNote: reason } : e
            )
        );

        try {
            await adminEnrollmentsService.decideEnrollment(selectedEnrollment.id, "REJECT", reason);
            showToast("Enrollment rejected", "success");
            loadEnrollments();
        } catch (err) {
            console.error("Error rejecting enrollment:", err);
            showToast("Failed to reject enrollment", "error");
            loadEnrollments();
        } finally {
            setPendingAction(null);
            setSelectedEnrollment(null);
        }
    };

    // Handle assign advisor
    const handleAssignAdvisor = async (advisorId) => {
        if (!selectedEnrollment || !advisorId) return;

        setShowAdvisorModal(false);
        const advisor = advisors.find((a) => a.id.toString() === advisorId.toString());

        // Optimistic update
        setEnrollments((prev) =>
            prev.map((e) =>
                e.id === selectedEnrollment.id ? { ...e, advisor: advisor } : e
            )
        );

        try {
            await adminEnrollmentsService.assignAdvisor(selectedEnrollment.id, advisorId);
            showToast("Advisor assigned successfully", "success");
            loadEnrollments();
        } catch (err) {
            console.error("Error assigning advisor:", err);
            showToast("Failed to assign advisor", "error");
            loadEnrollments();
        } finally {
            setSelectedEnrollment(null);
        }
    };

    // Open modals
    const openDetailModal = (enrollment) => {
        setSelectedEnrollment(enrollment);
        setShowDetailModal(true);
    };

    const openApproveModal = (enrollment) => {
        setSelectedEnrollment(enrollment);
        setShowApproveModal(true);
    };

    const openRejectModal = (enrollment) => {
        setSelectedEnrollment(enrollment);
        setShowRejectModal(true);
    };

    const openAdvisorModal = (enrollment) => {
        setSelectedEnrollment(enrollment);
        // Load advisors filtered by department if available
        if (enrollment.department) {
            loadAdvisors(enrollment.department);
        }
        setShowAdvisorModal(true);
    };

    // Stats
    const pendingCount = enrollments.filter((e) => e.status?.toUpperCase() === "PENDING").length;
    const approvedCount = enrollments.filter((e) => e.status?.toUpperCase() === "APPROVED").length;
    const rejectedCount = enrollments.filter((e) => e.status?.toUpperCase() === "REJECTED").length;

    return (
        <div className="admin-page">
            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Sidebar */}
            <aside className="admin-sidebar">
                <h2 className="admin-logo">U-Manage</h2>
                <nav className="admin-menu">
                    <button className="menu-item" onClick={() => navigate("/admin/dashboard")}>
                        Dashboard
                    </button>
                    <button className="menu-item" onClick={() => navigate("/admin/facilities")}>
                        Facilities
                    </button>
                    <button className="menu-item" onClick={() => navigate("/admin/curriculum")}>
                        Curriculum
                    </button>

                    {/* Staff Dropdown */}
                    <div>
                        <button
                            className="menu-item"
                            onClick={() => setStaffMenuOpen(!staffMenuOpen)}
                            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}
                        >
                            Staff
                            <span style={{ fontSize: 10 }}>{staffMenuOpen ? "▼" : "▶"}</span>
                        </button>
                        {staffMenuOpen && (
                            <div style={{ paddingLeft: 16 }}>
                                <button className="menu-item" onClick={() => navigate("/admin/staff/directory")} style={{ fontSize: 13 }}>
                                    Directory
                                </button>
                            </div>
                        )}
                    </div>

                    <button className="menu-item active" onClick={() => navigate("/admin/enrollments")}>
                        Enrollments
                    </button>
                    <button className="menu-item" onClick={() => alert("Community soon")}>
                        Community
                    </button>
                </nav>

                {/* Logout button */}
                <div style={{ marginTop: "auto", padding: "20px" }}>
                    <button
                        onClick={() => {
                            localStorage.removeItem("token");
                            localStorage.removeItem("user");
                            localStorage.removeItem("student");
                            socketService.disconnect();
                            navigate("/login");
                        }}
                        style={{
                            width: "100%",
                            padding: "12px 16px",
                            borderRadius: 8,
                            border: "none",
                            background: "rgba(239, 68, 68, 0.1)",
                            color: "#ef4444",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            fontWeight: 500,
                            transition: "all 0.2s"
                        }}
                        onMouseOver={(e) => e.target.style.background = "rgba(239, 68, 68, 0.2)"}
                        onMouseOut={(e) => e.target.style.background = "rgba(239, 68, 68, 0.1)"}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="admin-main">
                <header className="admin-header">
                    <div>
                        <h1>Enrollment Requests</h1>
                        <p className="subtitle">
                            Manage student enrollment requests, assign advisors, and approve/reject applications.
                        </p>
                        {error && <p style={{ color: "red", marginTop: 4, fontSize: 13 }}>{error}</p>}
                    </div>

                    <div className="header-right">
                        <div className="admin-user">
                            <div className="avatar">A</div>
                            <div>
                                <p className="user-name">Admin</p>
                                <p className="user-role">System Administrator</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Stats Cards - Compact design */}
                <section style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 16,
                    marginBottom: 24
                }}>
                    <div style={{
                        background: "white",
                        borderRadius: 10,
                        padding: "16px 20px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                        borderLeft: "4px solid #6366f1",
                        display: "flex",
                        alignItems: "center",
                        gap: 14
                    }}>
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            background: "#eef2ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>Total</p>
                            <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1f2937" }}>{loading ? "…" : enrollments.length}</h3>
                        </div>
                    </div>

                    <div style={{
                        background: "white",
                        borderRadius: 10,
                        padding: "16px 20px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                        borderLeft: "4px solid #f59e0b",
                        display: "flex",
                        alignItems: "center",
                        gap: 14
                    }}>
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            background: "#fef3c7",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>Pending</p>
                            <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#f59e0b" }}>{loading ? "…" : pendingCount}</h3>
                        </div>
                    </div>

                    <div style={{
                        background: "white",
                        borderRadius: 10,
                        padding: "16px 20px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                        borderLeft: "4px solid #10b981",
                        display: "flex",
                        alignItems: "center",
                        gap: 14
                    }}>
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            background: "#d1fae5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>Approved</p>
                            <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#10b981" }}>{loading ? "…" : approvedCount}</h3>
                        </div>
                    </div>

                    <div style={{
                        background: "white",
                        borderRadius: 10,
                        padding: "16px 20px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                        borderLeft: "4px solid #ef4444",
                        display: "flex",
                        alignItems: "center",
                        gap: 14
                    }}>
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            background: "#fee2e2",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>Rejected</p>
                            <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#ef4444" }}>{loading ? "…" : rejectedCount}</h3>
                        </div>
                    </div>
                </section>

                {/* Filters */}
                <section className="panel" style={{ marginBottom: 24 }}>
                    <h3>Filters</h3>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                                padding: "8px 12px",
                                borderRadius: 6,
                                border: "1px solid #d1d5db",
                                minWidth: 140,
                            }}
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="DROP">Dropped</option>
                        </select>

                        <select
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            style={{
                                padding: "8px 12px",
                                borderRadius: 6,
                                border: "1px solid #d1d5db",
                                minWidth: 160,
                            }}
                        >
                            <option value="">All Departments</option>
                            {departments.map((dept) => (
                                <option key={dept} value={dept}>
                                    {dept}
                                </option>
                            ))}
                        </select>

                        <input
                            type="search"
                            placeholder="Search student or course..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                padding: "8px 12px",
                                borderRadius: 6,
                                border: "1px solid #d1d5db",
                                flex: 1,
                                minWidth: 200,
                            }}
                        />

                        <button
                            onClick={loadEnrollments}
                            style={{
                                padding: "8px 16px",
                                borderRadius: 6,
                                border: "none",
                                background: "#2563eb",
                                color: "white",
                                cursor: "pointer",
                            }}
                        >
                            Refresh
                        </button>
                    </div>
                </section>

                {/* Enrollments Table */}
                <section className="panel">
                    <h3>Enrollment Requests</h3>

                    {loading && <p style={{ padding: 20 }}>Loading enrollments...</p>}

                    {!loading && enrollments.length === 0 && (
                        <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                            <p style={{ fontSize: 16, marginBottom: 8 }}>No enrollment requests found</p>
                            <p style={{ fontSize: 13 }}>
                                {statusFilter !== "ALL"
                                    ? `No ${statusFilter.toLowerCase()} requests match your filters.`
                                    : "There are no enrollment requests yet."}
                            </p>
                        </div>
                    )}

                    {!loading && enrollments.length > 0 && (
                        <div style={{ overflowX: "auto" }}>
                            <table className="activity-table" style={{ minWidth: 900 }}>
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Student ID</th>
                                        <th>Course</th>
                                        <th>Department</th>
                                        <th>Advisor</th>
                                        <th>Status</th>
                                        <th>Requested At</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {enrollments.map((enr) => (
                                        <tr
                                            key={enr.id}
                                            style={{
                                                opacity: pendingAction?.id === enr.id ? 0.6 : 1,
                                                transition: "opacity 0.2s",
                                            }}
                                        >
                                            <td>
                                                <div>
                                                    <div style={{ fontWeight: 500 }}>{enr.studentName}</div>
                                                    {enr.studentEmail && (
                                                        <div style={{ fontSize: 12, color: "#6b7280" }}>{enr.studentEmail}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{enr.studentId}</td>
                                            <td>
                                                <div>
                                                    <div style={{ fontWeight: 500 }}>{enr.courseCode}</div>
                                                    <div style={{ fontSize: 12, color: "#6b7280" }}>{enr.courseTitle}</div>
                                                </div>
                                            </td>
                                            <td>{enr.department || "N/A"}</td>
                                            <td>
                                                {enr.advisor ? (
                                                    <span style={{ color: "#10b981" }}>
                                                        {enr.advisor.name || enr.advisor.email}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: "#f59e0b" }}>Unassigned</span>
                                                )}
                                            </td>
                                            <td>
                                                <StatusBadge status={enr.status} />
                                            </td>
                                            <td style={{ fontSize: 13 }}>
                                                {new Date(enr.createdAt).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                    <button
                                                        onClick={() => openDetailModal(enr)}
                                                        style={{
                                                            padding: "4px 8px",
                                                            borderRadius: 4,
                                                            border: "1px solid #d1d5db",
                                                            background: "white",
                                                            cursor: "pointer",
                                                            fontSize: 12,
                                                        }}
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => openAdvisorModal(enr)}
                                                        style={{
                                                            padding: "4px 8px",
                                                            borderRadius: 4,
                                                            border: "none",
                                                            background: "#7c3aed",
                                                            color: "white",
                                                            cursor: "pointer",
                                                            fontSize: 12,
                                                        }}
                                                    >
                                                        Assign
                                                    </button>
                                                    {enr.status?.toUpperCase() === "PENDING" && (
                                                        <>
                                                            <button
                                                                onClick={() => openApproveModal(enr)}
                                                                style={{
                                                                    padding: "4px 8px",
                                                                    borderRadius: 4,
                                                                    border: "none",
                                                                    background: "#10b981",
                                                                    color: "white",
                                                                    cursor: "pointer",
                                                                    fontSize: 12,
                                                                }}
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => openRejectModal(enr)}
                                                                style={{
                                                                    padding: "4px 8px",
                                                                    borderRadius: 4,
                                                                    border: "none",
                                                                    background: "#ef4444",
                                                                    color: "white",
                                                                    cursor: "pointer",
                                                                    fontSize: 12,
                                                                }}
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
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
                enrollment={selectedEnrollment}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedEnrollment(null);
                }}
            />

            <ConfirmModal
                isOpen={showApproveModal}
                title="Approve Enrollment"
                message={`Are you sure you want to approve ${selectedEnrollment?.studentName}'s enrollment in ${selectedEnrollment?.courseCode}?`}
                confirmText="Approve"
                onConfirm={handleApprove}
                onCancel={() => {
                    setShowApproveModal(false);
                    setSelectedEnrollment(null);
                }}
            />

            <RejectModal
                isOpen={showRejectModal}
                onConfirm={handleReject}
                onCancel={() => {
                    setShowRejectModal(false);
                    setSelectedEnrollment(null);
                }}
            />

            <AssignAdvisorModal
                isOpen={showAdvisorModal}
                enrollment={selectedEnrollment}
                advisors={advisors}
                onConfirm={handleAssignAdvisor}
                onCancel={() => {
                    setShowAdvisorModal(false);
                    setSelectedEnrollment(null);
                }}
            />
        </div>
    );
}

export default AdminEnrollments;
