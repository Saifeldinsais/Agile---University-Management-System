import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import parentService from "../../services/parentService";
import "../../assets/Auth.css"; // Reuse existing auth styles

function ParentSignup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        occupation: "",
        relationship: "parent",
        address: ""
    });

    const [status, setStatus] = useState("");
    const [statusType, setStatusType] = useState(""); // 'error', 'success'

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    async function handleSubmit(e) {
        e.preventDefault();
        setStatus("");
        setStatusType("");

        if (formData.password !== formData.confirmPassword) {
            setStatus("Passwords do not match");
            setStatusType("error");
            return;
        }

        try {
            setStatus("Creating account...");
            await parentService.register({
                full_name: formData.full_name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                occupation: formData.occupation,
                relationship: formData.relationship,
                address: formData.address
            });

            setStatus("Account created successfully! Redirecting to login...");
            setStatusType("success");

            setTimeout(() => {
                navigate("/parent/login");
            }, 1500);

        } catch (err) {
            console.error("Signup error:", err);
            setStatus(err.response?.data?.message || "Registration failed. Please try again.");
            setStatusType("error");
        }
    }

    return (
        <div className="auth-container">
            <h1 className="auth-title">Parent Registration</h1>

            <form onSubmit={handleSubmit} className="signup-form">
                <label className="auth-label">Full Name</label>
                <input
                    type="text"
                    className="auth-input"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                />

                <label className="auth-label">Email</label>
                <input
                    type="email"
                    className="auth-input"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />

                <div className="form-row">
                    <div className="form-group">
                        <label className="auth-label">Password</label>
                        <input
                            type="password"
                            className="auth-input"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="auth-label">Confirm Password</label>
                        <input
                            type="password"
                            className="auth-input"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="auth-label">Phone</label>
                        <input
                            type="tel"
                            className="auth-input"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label className="auth-label">Relationship to Student</label>
                        <select
                            className="auth-input"
                            name="relationship"
                            value={formData.relationship}
                            onChange={handleChange}
                        >
                            <option value="parent">Parent</option>
                            <option value="guardian">Guardian</option>
                            <option value="mother">Mother</option>
                            <option value="father">Father</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>

                <label className="auth-label">Occupation (Optional)</label>
                <input
                    type="text"
                    className="auth-input"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleChange}
                />

                <label className="auth-label">Address (Optional)</label>
                <textarea
                    className="auth-input"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="2"
                />

                <button className="auth-btn" type="submit">
                    Register
                </button>
            </form>

            {status && (
                <p className={`auth-status ${statusType}`}>
                    {status}
                </p>
            )}

            <div className="auth-footer">
                <p>
                    Already have an account? <Link to="/parent/login">Login here</Link>
                </p>
                <p>
                    <Link to="/">Back to Home</Link>
                </p>
            </div>

            <style>{`
        .form-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .form-group {
          flex: 1;
        }
        .auth-container {
          max-width: 500px;
        }
      `}</style>
        </div>
    );
}

export default ParentSignup;
