import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import parentService from "../../services/parentService";
import "../../assets/Auth.css"; // Reuse existing auth styles

function ParentLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState("");
    const [statusType, setStatusType] = useState(""); // 'error', 'success'

    async function handleSubmit(e) {
        e.preventDefault();
        setStatus("Logging in...");
        setStatusType("");

        try {
            await parentService.login(email, password);
            setStatus("Login successful!");
            setStatusType("success");

            // Redirect to parent dashboard
            setTimeout(() => {
                navigate("/parent/dashboard");
            }, 1000);

        } catch (err) {
            console.error("Login error:", err);
            setStatus(err.response?.data?.message || "Login failed. Please check your credentials.");
            setStatusType("error");
        }
    }

    return (
        <div className="auth-container">
            <h1 className="auth-title">Parent Login</h1>

            <div className="auth-subtitle">
                Welcome to the Parent Portal. Please log in to view your child's progress.
            </div>

            <form onSubmit={handleSubmit}>
                <label className="auth-label">Email</label>
                <input
                    type="email"
                    className="auth-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="parent@example.com"
                    required
                />

                <label className="auth-label">Password</label>
                <input
                    type="password"
                    className="auth-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                />

                <button className="auth-btn" type="submit">
                    Login
                </button>
            </form>

            {status && (
                <p className={`auth-status ${statusType}`}>
                    {status}
                </p>
            )}

            <div className="auth-footer">
                <p>
                    Don't have an account? <Link to="/parent/signup">Sign up here</Link>
                </p>
                <p>
                    <Link to="/">Back to Home</Link>
                </p>
            </div>

            <style>{`
        .auth-subtitle {
          text-align: center;
          color: #a0aec0;
          margin-bottom: 2rem;
        }
        .auth-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.9rem;
        }
        .auth-footer a {
          color: #667eea;
          text-decoration: none;
        }
        .auth-footer a:hover {
          text-decoration: underline;
        }
        .auth-footer p {
          margin: 0.5rem 0;
          color: #a0aec0;
        }
      `}</style>
        </div>
    );
}

export default ParentLogin;
