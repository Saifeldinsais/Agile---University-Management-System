import { useState } from "react";
import { loginUser } from "../services/authService";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("Loading...");

    try {
      const data = await loginUser({ email, password });
      console.log("Login response:", data);

      // Store user data
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      localStorage.setItem("email", data.user.email);

      setStatus("Login successful!");

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
        }
      }

      // Navigate based on user type
      if (userType === "admin") {
        navigate("/admin/dashboard");
      } else if (userType === "student") {
        navigate("/student/");
      } else if (userType === "doctor") {
        navigate("/doctor/");
      } else if (userType === "ta") {
        navigate("/ta/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Login error:", err?.response?.data);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please try again.";
      setStatus(msg);
    }
  }

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
        <p
          className={`auth-status ${status.toLowerCase().includes("success") ? "success" : "error"
            }`}
        >
          {status}
        </p>
      )}
    </div>
  );
}

export default Login;
