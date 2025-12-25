import React, { useState } from 'react';

/**
 * Modal to display temporary password after creating a staff account
 */
const TemporaryPasswordModal = ({ isOpen, staffName, temporaryPassword, onClose }) => {
    const [copied, setCopied] = useState(false);

    const handleCopyPassword = async () => {
        try {
            await navigator.clipboard.writeText(temporaryPassword);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleCopyAll = async () => {
        const text = `Staff Account Created\nName: ${staffName}\nTemporary Password: ${temporaryPassword}\n\nNote: Staff member must change password on first login.`;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="temp-password-overlay">
            <div className="temp-password-modal">
                <div className="modal-icon success">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>

                <h2>Staff Account Created!</h2>
                <p className="subtitle">
                    Account for <strong>{staffName}</strong> has been created successfully.
                </p>

                <div className="password-section">
                    <label>Temporary Password</label>
                    <div className="password-display">
                        <code>{temporaryPassword}</code>
                        <button
                            onClick={handleCopyPassword}
                            className="copy-btn"
                            title="Copy password"
                        >
                            {copied ? '✓' : '📋'}
                        </button>
                    </div>
                </div>

                <div className="warning-box">
                    <span className="warning-icon">⚠️</span>
                    <div>
                        <strong>Important:</strong>
                        <ul>
                            <li>Share this password securely with the staff member</li>
                            <li>They will be required to change it on first login</li>
                            <li>This password will not be shown again</li>
                        </ul>
                    </div>
                </div>

                <div className="button-group">
                    <button onClick={handleCopyAll} className="btn-secondary">
                        📄 Copy All Details
                    </button>
                    <button onClick={onClose} className="btn-primary">
                        Done
                    </button>
                </div>
            </div>

            <style>{`
                .temp-password-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
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

                .temp-password-modal {
                    background: white;
                    border-radius: 16px;
                    padding: 32px;
                    width: 90%;
                    max-width: 480px;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
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

                .modal-icon {
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                }

                .modal-icon.success {
                    background: #d1fae5;
                    color: #059669;
                }

                .temp-password-modal h2 {
                    text-align: center;
                    margin: 0 0 8px;
                    color: #1f2937;
                    font-size: 1.5rem;
                }

                .temp-password-modal .subtitle {
                    text-align: center;
                    color: #6b7280;
                    margin: 0 0 24px;
                }

                .temp-password-modal .subtitle strong {
                    color: #374151;
                }

                .password-section {
                    margin-bottom: 20px;
                }

                .password-section label {
                    display: block;
                    font-size: 0.85rem;
                    color: #6b7280;
                    margin-bottom: 8px;
                    font-weight: 500;
                }

                .password-display {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: #f3f4f6;
                    border-radius: 8px;
                    padding: 12px 16px;
                    border: 1px solid #e5e7eb;
                }

                .password-display code {
                    flex: 1;
                    font-family: 'Courier New', monospace;
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #1f2937;
                    letter-spacing: 0.5px;
                }

                .copy-btn {
                    padding: 8px 12px;
                    border-radius: 6px;
                    border: none;
                    background: #2563eb;
                    color: white;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.2s ease;
                }

                .copy-btn:hover {
                    background: #1d4ed8;
                }

                .warning-box {
                    display: flex;
                    gap: 12px;
                    background: #fef3c7;
                    border: 1px solid #fcd34d;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 24px;
                }

                .warning-icon {
                    font-size: 1.2rem;
                    flex-shrink: 0;
                }

                .warning-box strong {
                    display: block;
                    color: #92400e;
                    margin-bottom: 8px;
                }

                .warning-box ul {
                    margin: 0;
                    padding-left: 20px;
                    color: #92400e;
                    font-size: 0.9rem;
                }

                .warning-box li {
                    margin-bottom: 4px;
                }

                .button-group {
                    display: flex;
                    gap: 12px;
                }

                .btn-secondary, .btn-primary {
                    flex: 1;
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-size: 0.95rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                }

                .btn-secondary {
                    background: #f3f4f6;
                    color: #374151;
                }

                .btn-secondary:hover {
                    background: #e5e7eb;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                }

                .btn-primary:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                }
            `}</style>
        </div>
    );
};

export default TemporaryPasswordModal;
