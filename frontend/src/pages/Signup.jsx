import { useState } from "react";
import { registerUser } from "../services/authService";
import { useNavigate } from 'react-router-dom'

function Signup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setStatus("Passwords do not match");
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
      setStatus("Account created successfully!");
      setTimeout(() => navigate("/login"), 1500);

    } catch (err) {
      console.error("Signup error details:", err?.response?.data);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Signup failed. Please try again.";
      setStatus(msg);
    }
  }

  return (
    <div className="auth-container">
      <h1 className="auth-title">Sign Up</h1>

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
          className="auth-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@ums-student.com or jane@ums-doctor.com"
        />
        <p className="auth-hint">
          Use <strong>@ums-student.com</strong> for students or <strong>@ums-doctor.com</strong> for teachers
        </p>

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

        <button className="auth-btn" type="submit">
          Sign Up
        </button>
      </form>

      {status && (
        <p
          className={`auth-status ${status.includes("success") ? "success" : "error"
            }`}
        >
          {status}
        </p>
      )}
    </div>
  );
}

export default Signup;
