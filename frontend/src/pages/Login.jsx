import { useState } from "react";
import { loginUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import PasswordChangeModal from "../components/PasswordChangeModal";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState(""); // 'error', 'warning', 'success'
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("Loading...");
    setStatusType("");

    try {
      const data = await loginUser({ email, password });
      console.log("Login response:", data);

      // Store user data
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      localStorage.setItem("email", data.user.email);

      // Determine navigation based on email domain
      let userType = data.user.userType; // Use backend userType if available

      // If not provided by backend, determine from email
      if (!userType) {
        const emailLower = email.toLowerCase();
        if (emailLower.includes("@admin")) {
          userType = "admin";
        } else if (emailLower.includes("@ums-student")) {
          userType = "student";
        } else if (emailLower.includes("@ums-doctor")) {
          userType = "doctor";
        } else if (emailLower.includes("@ums-ta")) {
          userType = "ta";
        } else if (emailLower.includes("@ums-advisor")) {
          userType = "advisor";
        }
      }

      // Determine target route
      let targetRoute = "/";
      if (userType === "admin") {
        targetRoute = "/admin/dashboard";
      } else if (userType === "student") {
        targetRoute = "/student/dashboard";
      } else if (userType === "doctor") {
        targetRoute = "/doctor/dashboard";
      } else if (userType === "ta") {
        targetRoute = "/ta/dashboard";
      } else if (userType === "advisor") {
        targetRoute = "/advisor/dashboard";
      }

      // Check if password change is required (staff first login)
      if (data.mustChangePassword || data.user?.mustChangePassword) {
        setStatus("Password change required for first login");
        setStatusType("warning");
        setPendingNavigation(targetRoute);
        setShowPasswordModal(true);
        return;
      }

      setStatus("Login successful!");
      setStatusType("success");
      navigate(targetRoute);

    } catch (err) {
      console.error("Login error:", err?.response?.data);
      const errorCode = err?.response?.data?.code;
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please try again.";

      // Handle specific error codes with appropriate messaging
      if (errorCode === "STAFF_NOT_PROVISIONED") {
        setStatusType("warning");
      } else if (errorCode === "ACCOUNT_DEACTIVATED") {
        setStatusType("warning");
      } else if (errorCode === "ACCOUNT_PENDING") {
        setStatusType("warning");
      } else {
        setStatusType("error");
      }

      setStatus(msg);
    }
  }

  const handlePasswordChangeSuccess = () => {
    setShowPasswordModal(false);
    setStatus("Password changed successfully! Redirecting...");
    setStatusType("success");

    // Navigate to the pending destination
    setTimeout(() => {
      if (pendingNavigation) {
        navigate(pendingNavigation);
      }
    }, 1000);
  };

  const getStatusClass = () => {
    if (statusType === "success") return "success";
    if (statusType === "warning") return "warning";
    if (statusType === "error") return "error";
    if (status.toLowerCase().includes("success")) return "success";
    if (status.toLowerCase().includes("loading")) return "";
    return "error";
  };

  return (
    <div className="auth-container">
      <h1 className="auth-title">Login</h1>

      <form onSubmit={handleSubmit}>
        <label className="auth-label">Email</label>
        <input
          type="email"
          className="auth-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your-email@ums-student.com"
        />

        <label className="auth-label">Password</label>
        <input
          type="password"
          className="auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        <button className="auth-btn" type="submit">
          Login
        </button>
      </form>

      {status && (
        <p className={`auth-status ${getStatusClass()}`}>
          {status}
        </p>
      )}

      {/* Staff & Parent Notice */}
      <div className="staff-notice">
        <p>
          <strong>Staff Members:</strong> Doctor, TA, and Advisor accounts must be created by the administration.
        </p>
        <p style={{ marginTop: '8px', borderTop: '1px solid rgba(99, 102, 241, 0.2)', paddingTop: '8px' }}>
          <strong>Parents:</strong> Please use the <a href="/parent/login" style={{ color: '#fff', textDecoration: 'underline' }}>Parent Portal Login</a>.
        </p>
      </div>

      {/* Password Change Modal for First Login */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordChangeSuccess}
        isRequired={true}
      />

      <style>{`
        .auth-status.warning {
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          padding: 12px;
          border-radius: 8px;
          margin-top: 16px;
        }

        .staff-notice {
          margin-top: 24px;
          padding: 16px;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 8px;
          font-size: 0.85rem;
          color: #a5b4fc;
        }

        .staff-notice p {
          margin: 0;
          line-height: 1.5;
        }

        .staff-notice strong {
          color: #c7d2fe;
        }
      `}</style>
    </div>
  );
}

export default Login;
