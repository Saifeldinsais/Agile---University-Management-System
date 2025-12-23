import React, { useState } from 'react';
import axios from 'axios';

/**
 * Password Change Modal
 * Shown to staff members on first login when mustChangePassword is true
 */
const PasswordChangeModal = ({ isOpen, onClose, onSuccess, isRequired = false }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('All fields are required');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (currentPassword === newPassword) {
            setError('New password must be different from current password');
            return;
        }

        // Password strength check
        const hasUpperCase = /[A-Z]/.test(newPassword);
        const hasLowerCase = /[a-z]/.test(newPassword);
        const hasNumbers = /\d/.test(newPassword);
        if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
            setError('Password must contain uppercase, lowercase, and numbers');
            return;
        }

        setLoading(true);


        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/api/auth/change-password`,
                { currentPassword, newPassword, confirmNewPassword: confirmPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update user in localStorage to remove mustChangePassword
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.mustChangePassword = false;
            localStorage.setItem('user', JSON.stringify(user));

            onSuccess?.();
            if (!isRequired) {
                onClose?.();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="password-modal-overlay">
            <div className="password-modal">
                <div className="password-modal-header">
                    <h2>
                        {isRequired ? '🔐 Password Change Required' : '🔒 Change Password'}
                    </h2>
                    {isRequired && (
                        <p className="required-notice">
                            This is your first login. You must change your temporary password to continue.
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="password-form">
                    {error && (
                        <div className="error-message">
                            <span className="error-icon">⚠️</span>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="currentPassword">
                            {isRequired ? 'Temporary Password' : 'Current Password'}
                        </label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPasswords ? 'text' : 'password'}
                                id="currentPassword"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder={isRequired ? 'Enter temporary password provided by admin' : 'Enter current password'}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="newPassword">New Password</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPasswords ? 'text' : 'password'}
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password (min 8 chars)"
                                disabled={loading}
                            />
                        </div>
                        <div className="password-requirements">
                            <span className={newPassword.length >= 8 ? 'met' : ''}>
                                ✓ 8+ characters
                            </span>
                            <span className={/[A-Z]/.test(newPassword) ? 'met' : ''}>
                                ✓ Uppercase
                            </span>
                            <span className={/[a-z]/.test(newPassword) ? 'met' : ''}>
                                ✓ Lowercase
                            </span>
                            <span className={/\d/.test(newPassword) ? 'met' : ''}>
                                ✓ Number
                            </span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPasswords ? 'text' : 'password'}
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                disabled={loading}
                            />
                        </div>
                        {confirmPassword && newPassword !== confirmPassword && (
                            <span className="match-indicator no-match">Passwords don't match</span>
                        )}
                        {confirmPassword && newPassword === confirmPassword && (
                            <span className="match-indicator match">Passwords match ✓</span>
                        )}
                    </div>

                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={showPasswords}
                                onChange={(e) => setShowPasswords(e.target.checked)}
                            />
                            Show passwords
                        </label>
                    </div>

                    <div className="button-group">
                        {!isRequired && (
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={loading}
                        >
                            {loading ? 'Changing Password...' : 'Change Password'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .password-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    animation: fadeIn 0.2s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .password-modal {
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                    border-radius: 16px;
                    padding: 32px;
                    width: 90%;
                    max-width: 440px;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    animation: slideUp 0.3s ease;
                }

                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .password-modal-header {
                    text-align: center;
                    margin-bottom: 24px;
                }

                .password-modal-header h2 {
                    color: #f8fafc;
                    font-size: 1.5rem;
                    margin: 0 0 8px 0;
                }

                .required-notice {
                    color: #fbbf24;
                    font-size: 0.9rem;
                    margin: 0;
                    padding: 12px;
                    background: rgba(251, 191, 36, 0.1);
                    border-radius: 8px;
                    border: 1px solid rgba(251, 191, 36, 0.2);
                }

                .password-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .error-message {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #fca5a5;
                    padding: 12px 16px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.9rem;
                }

                .error-icon {
                    font-size: 1rem;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .form-group label {
                    color: #94a3b8;
                    font-size: 0.9rem;
                    font-weight: 500;
                }

                .password-input-wrapper {
                    position: relative;
                }

                .password-input-wrapper input {
                    width: 100%;
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    color: #f8fafc;
                    font-size: 1rem;
                    transition: all 0.2s ease;
                    box-sizing: border-box;
                }

                .password-input-wrapper input:focus {
                    outline: none;
                    border-color: #8b5cf6;
                    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
                }

                .password-input-wrapper input::placeholder {
                    color: #64748b;
                }

                .password-input-wrapper input:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .password-requirements {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-top: 4px;
                }

                .password-requirements span {
                    font-size: 0.75rem;
                    color: #64748b;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 4px 8px;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                }

                .password-requirements span.met {
                    color: #4ade80;
                    background: rgba(74, 222, 128, 0.1);
                }

                .match-indicator {
                    font-size: 0.8rem;
                    margin-top: 4px;
                }

                .match-indicator.match {
                    color: #4ade80;
                }

                .match-indicator.no-match {
                    color: #f87171;
                }

                .checkbox-group {
                    flex-direction: row;
                    align-items: center;
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    color: #94a3b8;
                    font-size: 0.9rem;
                }

                .checkbox-label input[type="checkbox"] {
                    width: 16px;
                    height: 16px;
                    cursor: pointer;
                }

                .button-group {
                    display: flex;
                    gap: 12px;
                    margin-top: 8px;
                }

                .btn-cancel, .btn-submit {
                    flex: 1;
                    padding: 14px 24px;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                }

                .btn-cancel {
                    background: rgba(255, 255, 255, 0.1);
                    color: #94a3b8;
                }

                .btn-cancel:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.15);
                    color: #f8fafc;
                }

                .btn-submit {
                    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
                    color: white;
                }

                .btn-submit:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);
                }

                .btn-cancel:disabled, .btn-submit:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }
            `}</style>
        </div>
    );
};

export default PasswordChangeModal;
