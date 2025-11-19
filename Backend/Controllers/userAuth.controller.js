const JWT = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const Admin = require("../Models/admin.model");
const Student = require("../Models/student.model");

const signUp = async (req, res) => {
    try {
        let { username, email, password, confirmpassword } = req.body;
        if (!username || !email || !password || !confirmpassword) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (password !== confirmpassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        if (email.toLowerCase().includes("@admin")) {
            return res.status(400).json({ message: "You cannot use an email that contains '@admin'" });
        }

        let existingstudent = await Student.findOne({ email: email });
        if (existingstudent) {
            return res.status(400).json({ message: "Student with this email already exists" });
        }
        const newStudent = await Student.create({
            username,
            email,
            password,
        })


        const token = JWT.sign(
            { id: newStudent._id, username: newStudent.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION });

        res.status(201).json({
            status: "Success",
            data: { user: newStudent },
            token: token,
        });
    } catch (error) {
        res.status(400).json({ status: "Fail", message: error.message || "An error occurred" });

    }
}

const signIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email And Password Required" });
        }

        if (email.toLowerCase().includes("@admin")) {
            const admin = await Admin.findOne({ email: email });

            if (!admin) {
                return res.status(400).json({ message: "Invalid email or password" });
            }
            const isMatch = await bcrypt.compare(password, admin.password)
            if (!isMatch) {
                return res.status(400).json({ message: "Invalid email or password" });
            }

            const token = JWT.sign(
                { id: admin._id, username: admin.username, role: "admin" },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRATION }
            );

            res.status(200).json({
                status: "Success",
                data: { user: admin },
                token: token,
            });
        } else {
            const student = await Student.findOne({ email: email });
            if (!student) {
                return res.status(400).json({ message: "Invalid email or password" });
            }
            const isMatch = await bcrypt.compare(password, student.password)
            if (!isMatch) {
                return res.status(400).json({ message: "Invalid email or password" });
            }

            const token = JWT.sign(
                { id: student._id, username: student.username, role: "student" },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRATION }
            );

            res.status(200).json({
                status: "Success",
                data: { user: student },
                token: token,
            });
        }
    } catch (error) {
        res.status(400).json({ status: "Fail", message: error.message || "An error occurred" });
    }

}

module.exports = {
    signIn, signUp
}