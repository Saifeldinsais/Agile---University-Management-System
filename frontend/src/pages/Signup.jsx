import { useState, useEffect } from "react";
import { registerUser } from "../services/authService";
import { useNavigate } from 'react-router-dom'

// Staff email domains that are blocked from self-registration
const STAFF_EMAIL_PATTERNS = ['@ums-doctor', '@ums-ta', '@ums-advisor', '@admin'];

function Signup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState(""); // 'success', 'error', 'warning'
  const [isStaffEmail, setIsStaffEmail] = useState(false);

  // Check if email is a staff domain
  useEffect(() => {
    const emailLower = email.toLowerCase();
    const isStaff = STAFF_EMAIL_PATTERNS.some(pattern => emailLower.includes(pattern));
    setIsStaffEmail(isStaff);
  }, [email]);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("");
    setStatusType("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setStatus("Passwords do not match");
      setStatusType("error");
      return;
    }

    // Block staff registration with clear message
    if (isStaffEmail) {
      setStatus("Staff accounts (Doctor, TA, Advisor) cannot be created through public registration. Please contact your administrator.");
      setStatusType("warning");
      return;
    }

    try {
      const data = await registerUser({
        username,
        email,
        password,
        confirmpassword: confirmPassword,
      });

      console.log("Signup successful:", data);
      setStatus("Account created successfully! Redirecting to login...");
      setStatusType("success");
      setTimeout(() => navigate("/login"), 1500);

    } catch (err) {
      console.error("Signup error details:", err?.response?.data);
      const errorCode = err?.response?.data?.code;
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Signup failed. Please try again.";

      // Handle specific error codes
      if (errorCode === "STAFF_REGISTRATION_BLOCKED") {
        setStatusType("warning");
      } else {
        setStatusType("error");
      }

      setStatus(msg);
    }
  }

  const getStatusClass = () => {
    if (statusType === "success") return "success";
    if (statusType === "warning") return "warning";
    return "error";
  };

  return (
    <div className="auth-container">
      <h1 className="auth-title">Sign Up</h1>

      {/* Student-only registration notice */}
      <div className="registration-notice">
        <span className="notice-icon">📚</span>
        <p>
          <strong>Student Registration</strong><br />
          This registration is for students only. Staff accounts are created by the administration.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <label className="auth-label">Username</label>
        <input
          type="text"
          className="auth-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Your username"
        />

        <label className="auth-label">Email</label>
        <input
          type="email"
          className={`auth-input ${isStaffEmail ? 'input-warning' : ''}`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@ums-student.com"
        />

        {isStaffEmail ? (
          <div className="staff-warning">
            <span className="warning-icon">⚠️</span>
            <p>
              <strong>Staff Registration Not Allowed</strong><br />
              Doctor, TA, and Advisor accounts must be created by the administration.
              Please contact your department admin.
            </p>
          </div>
        ) : (
          <p className="auth-hint">
            Use <strong>@ums-student.com</strong> for student registration
          </p>
        )}

        <label className="auth-label">Password</label>
        <input
          type="password"
          className="auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        <label className="auth-label">Confirm Password</label>
        <input
          type="password"
          className="auth-input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
        />

        <button
          className={`auth-btn ${isStaffEmail ? 'btn-disabled' : ''}`}
          type="submit"
          disabled={isStaffEmail}
        >
          Sign Up
        </button>
      </form>

      {status && (
        <p className={`auth-status ${getStatusClass()}`}>
          {status}
        </p>
      )}

      <style>{`
        .registration-notice {
          display: flex;
          gap: 12px;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
          align-items: flex-start;
        }

        .registration-notice .notice-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .registration-notice p {
          margin: 0;
          font-size: 0.9rem;
          color: #a5b4fc;
          line-height: 1.4;
        }

        .registration-notice strong {
          color: #c7d2fe;
        }

        .staff-warning {
          display: flex;
          gap: 10px;
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 8px;
          padding: 12px;
          margin: 8px 0 16px;
        }

        .staff-warning .warning-icon {
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .staff-warning p {
          margin: 0;
          font-size: 0.85rem;
          color: #fbbf24;
          line-height: 1.4;
        }

        .staff-warning strong {
          color: #fcd34d;
          display: block;
          margin-bottom: 4px;
        }

        .input-warning {
          border-color: #f59e0b !important;
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2) !important;
        }

        .btn-disabled {
          opacity: 0.5 !important;
          cursor: not-allowed !important;
        }

        .auth-status.warning {
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          padding: 12px;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}

export default Signup;
