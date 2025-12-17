const JWT = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const userAuthService = require("../Services/userAuth.service");

const signUp = async (req, res) => {
    try {
        const { username, email, password, confirmpassword } = req.body;

        if (!username || !email || !password || !confirmpassword) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password !== confirmpassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        ////////////////////////////////////////////////////////////////////
        if (email.toLowerCase().includes("@admin")) {  // if you want to create admin for the time comment this if block//
            ////////////////////////////////////////////////////////////////////////////
            return res.status(400).json({ message: "Cannot register as admin" });
        }

        let type = "student";
        if (email.toLowerCase().includes("@ums-doctor")) {
            type = "doctor";
        } else if (email.toLowerCase().includes("@ums-student")) {
            type = "student";
        } else {
            return res.status(400).json({ message: "Invalid email domain for registration" });
        }
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

        const token = JWT.sign(
            { id: result.userId, username: username, role: type },
            process.env.JWT_SECRET || "default_secret_key_change_in_production",
            { expiresIn: process.env.JWT_EXPIRATION || "7d" }
        );



        if (result.success) {
            return res.status(201).json({
                status: "Success",
                message: result.message,
                userId: result.userId,
                token: token
            });
        }
        return res.status(400).json({ status: "Fail", message: result.message });

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

        // Determine user type from email
        let type = "student";
        if (email.toLowerCase().includes("@ums-doctor")) {
            type = "doctor";
        } else if (email.toLowerCase().includes("@admin")) {
            type = "admin";
        } else if (email.toLowerCase().includes("@ums-student")) {
            type = "student";
        } else {
            return res.status(400).json({ message: "Invalid email domain" });
        }

        // Call service
        const result = await userAuthService.loginUser({ email, password });

        const token = JWT.sign(
            { id: result.user?.id, email: email, role: type },
            process.env.JWT_SECRET || "default_secret_key_change_in_production",
            { expiresIn: process.env.JWT_EXPIRATION || "7d" }
        );

        if (result.success) {
            return res.status(200).json({
                status: "Success",
                user: result.user,
                token: token
            });
        }
        return res.status(401).json({ status: "Fail", message: result.message });

    } catch (error) {
        res.status(500).json({ status: "Fail", message: error.message });
    }
};

module.exports = { signUp, signIn };