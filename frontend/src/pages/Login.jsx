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
      // data = { status, data: { user }, token }

      setStatus("Login successful!");
      // save token (optional but useful)
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      localStorage.setItem("email", data.data.user.email);

      const isAdmin = data.data.user.email.toLowerCase().includes("@admin");
      const studentCheck = data.data.user.email.toLowerCase().includes("@ums-student");

      // If the logged-in user is a student, save the full user object
      // so student pages can access profile info locally.
      if (studentCheck && data.data.user) {
        try {
          localStorage.setItem("student", JSON.stringify(data.data.user));
        } catch (e) {
          console.error('Failed to persist student in localStorage', e);
        }
      }

      if (isAdmin) {
        // ✅ ADMIN REDIRECT HERE
        navigate("/admin/dashboard");
      } 
      else if(studentCheck){
        // localStorage.setItem("token" , data.data.token);
        navigate("/student/");
      }
      else {
        navigate("/");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err.message ||
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
          placeholder="name@example.com"
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
          className={`auth-status ${
            status.toLowerCase().includes("success") ? "success" : "error"
          }`}
        >
          {status}
        </p>
      )}
    </div>
  );
}

export default Login;
