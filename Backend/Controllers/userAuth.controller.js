const JWT = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const userAuthService = require("../Services/userAuth.service");

// Roles that cannot self-register
const ADMIN_PROVISIONED_ROLES = ['doctor', 'ta', 'advisor', 'professor', 'staff'];

const signUp = async (req, res) => {
    try {
        const { username, email, password, confirmpassword } = req.body;

        if (!username || !email || !password || !confirmpassword) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password !== confirmpassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        // Block admin registration
        if (email.toLowerCase().includes("@admin")) {
            return res.status(400).json({ message: "Cannot register as admin" });
        }

        // Determine user type from email
        let type = "student";
        if (email.toLowerCase().includes("@ums-doctor")) {
            type = "doctor";
        } else if (email.toLowerCase().includes("@ums-ta")) {
            type = "ta";
        } else if (email.toLowerCase().includes("@ums-advisor")) {
            type = "advisor";
        } else if (email.toLowerCase().includes("@ums-student")) {
            type = "student";
        } else {
            return res.status(400).json({ message: "Invalid email domain for registration" });
        }

        // ========== SECURITY: Block staff self-registration ==========
        if (ADMIN_PROVISIONED_ROLES.includes(type)) {
            return res.status(403).json({
                message: "Staff accounts (Doctor/TA/Advisor) cannot be created through public registration. Please contact your administrator to create your account.",
                code: "STAFF_REGISTRATION_BLOCKED"
            });
        }
        // ==============================================================

        const existinguser = await userAuthService.checkUserExists(email);
        if (existinguser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        // Call service
        const result = await userAuthService.registerUser({
            email,
            password,
            confirmPassword: confirmpassword,
            username,
            userType: type
        });

        if (!result.success) {
            return res.status(400).json({ status: "Fail", message: result.message });
        }

        const token = JWT.sign(
            { id: result.userId, username: username, role: type },
            process.env.JWT_SECRET || "default_secret_key_change_in_production",
            { expiresIn: process.env.JWT_EXPIRATION || "7d" }
        );

        return res.status(201).json({
            status: "Success",
            message: result.message,
            userId: result.userId,
            token: token
        });

    } catch (error) {
        res.status(500).json({ status: "Fail", message: error.message });
    }
};

const signIn = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }

        // Determine user type from email for token
        let type = "student";
        if (email.toLowerCase().includes("@ums-doctor")) {
            type = "doctor";
        } else if (email.toLowerCase().includes("@admin")) {
            type = "admin";
        } else if (email.toLowerCase().includes("@ums-ta")) {
            type = "ta";
        } else if (email.toLowerCase().includes("@ums-advisor")) {
            type = "advisor";
        } else if (email.toLowerCase().includes("@ums-student")) {
            type = "student";
        } else {
            return res.status(400).json({ message: "Invalid email domain" });
        }

        // Call service - security checks are performed inside
        const result = await userAuthService.loginUser({ email, password });

        if (!result.success) {
            // Check for specific error codes
            if (result.message.includes("must be created by the administration")) {
                return res.status(403).json({
                    status: "Fail",
                    message: result.message,
                    code: "STAFF_NOT_PROVISIONED"
                });
            }
            if (result.message.includes("deactivated")) {
                return res.status(403).json({
                    status: "Fail",
                    message: result.message,
                    code: "ACCOUNT_DEACTIVATED"
                });
            }
            if (result.message.includes("pending")) {
                return res.status(403).json({
                    status: "Fail",
                    message: result.message,
                    code: "ACCOUNT_PENDING"
                });
            }
            return res.status(401).json({ status: "Fail", message: result.message });
        }

        const token = JWT.sign(
            { id: result.user?.id, email: email, role: type },
            process.env.JWT_SECRET || "default_secret_key_change_in_production",
            { expiresIn: process.env.JWT_EXPIRATION || "7d" }
        );

        return res.status(200).json({
            status: "Success",
            user: result.user,
            token: token,
            mustChangePassword: result.user?.mustChangePassword || false
        });

    } catch (error) {
        res.status(500).json({ status: "Fail", message: error.message });
    }
};

/**
 * Change password - for first login or regular password change
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmNewPassword } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            return res.status(400).json({ message: "All password fields are required" });
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ message: "New passwords do not match" });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters" });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ message: "New password must be different from current password" });
        }

        const result = await userAuthService.changePassword(userId, currentPassword, newPassword);

        if (result.success) {
            return res.status(200).json({
                status: "Success",
                message: result.message
            });
        }

        return res.status(400).json({ status: "Fail", message: result.message });

    } catch (error) {
        res.status(500).json({ status: "Fail", message: error.message });
    }
};

/**
 * Admin creates a staff account with temporary password
 */
const adminCreateStaffAccount = async (req, res) => {
    try {
        const { email, username, userType, department, specialization } = req.body;
        const adminId = req.user?.id;
        const adminRole = req.user?.role;

        // Only admins can create staff accounts
        if (adminRole !== 'admin') {
            return res.status(403).json({ message: "Only administrators can create staff accounts" });
        }

        if (!email || !username) {
            return res.status(400).json({ message: "Email and username are required" });
        }

        const result = await userAuthService.createStaffAccount(
            { email, username, userType: userType || 'doctor' },
            adminId
        );

        if (result.success) {
            return res.status(201).json({
                status: "Success",
                message: result.message,
                userId: result.userId,
                temporaryPassword: result.temporaryPassword
            });
        }

        return res.status(400).json({ status: "Fail", message: result.message });

    } catch (error) {
        res.status(500).json({ status: "Fail", message: error.message });
    }
};

/**
 * Admin resets a staff member's password
 */
const adminResetStaffPassword = async (req, res) => {
    try {
        const { staffUserId } = req.params;
        const adminId = req.user?.id;
        const adminRole = req.user?.role;

        // Only admins can reset passwords
        if (adminRole !== 'admin') {
            return res.status(403).json({ message: "Only administrators can reset staff passwords" });
        }

        if (!staffUserId) {
            return res.status(400).json({ message: "Staff user ID is required" });
        }

        const result = await userAuthService.adminResetPassword(parseInt(staffUserId), adminId);

        if (result.success) {
            return res.status(200).json({
                status: "Success",
                message: result.message,
                temporaryPassword: result.temporaryPassword
            });
        }

        return res.status(400).json({ status: "Fail", message: result.message });

    } catch (error) {
        res.status(500).json({ status: "Fail", message: error.message });
    }
};

/**
 * Admin updates staff account status (activate/deactivate)
 */
const adminUpdateStaffStatus = async (req, res) => {
    try {
        const { staffUserId } = req.params;
        const { status } = req.body;
        const adminId = req.user?.id;
        const adminRole = req.user?.role;

        // Only admins can update status
        if (adminRole !== 'admin') {
            return res.status(403).json({ message: "Only administrators can update account status" });
        }

        if (!staffUserId || !status) {
            return res.status(400).json({ message: "Staff user ID and status are required" });
        }

        if (!['active', 'inactive', 'pending'].includes(status)) {
            return res.status(400).json({ message: "Invalid status. Must be: active, inactive, or pending" });
        }

        const result = await userAuthService.updateAccountStatus(parseInt(staffUserId), status, adminId);

        if (result.success) {
            return res.status(200).json({
                status: "Success",
                message: result.message
            });
        }

        return res.status(400).json({ status: "Fail", message: result.message });

    } catch (error) {
        res.status(500).json({ status: "Fail", message: error.message });
    }
};

/**
 * Get current user info
 */
const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const user = await userAuthService.getUserById(userId);

        if (user) {
            return res.status(200).json({
                status: "Success",
                user
            });
        }

        return res.status(404).json({ status: "Fail", message: "User not found" });

    } catch (error) {
        res.status(500).json({ status: "Fail", message: error.message });
    }
};

module.exports = {
    signUp,
    signIn,
    changePassword,
    adminCreateStaffAccount,
    adminResetStaffPassword,
    adminUpdateStaffStatus,
    getCurrentUser
};