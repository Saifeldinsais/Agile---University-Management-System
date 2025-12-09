// const JWT = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");

// const Admin = require("../Models/admin.model");
// const Student = require("../Models/student.model");
// const Doctor = require("../Models/doctor.model");

const userAuthService = require("../Services/userAuth.service");

const signUp = async (req, res) => {
    try {
        const { username, email, password, confirmpassword} = req.body;

        if (!username || !email || !password || !confirmpassword) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password !== confirmpassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        let type = "student";
        if (email.toLowerCase().includes("@ums-doctor")) {
            type = "doctor";
        } else if (email.toLowerCase().includes("@admin")) {
            type = "admin";
        } else if (email.toLowerCase().includes("@ums-student")) {
            type = "student";
        } else {
            return res.status(400).json({ message: "Invalid email domain for registration" });
        }

        // Call service
        const result = await userAuthService.registerUser({
            email,
            password,
            confirmPassword: confirmpassword,
            username,
            userType: type
        });

        

        if (result.success) {
            return res.status(201).json({
                status: "Success",
                message: result.message,
                userId: result.userId
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

        if (result.success) {
            return res.status(200).json({
                status: "Success",
                token: result.token,
                user : result.user
            });
        }
        return res.status(401).json({ status: "Fail", message: result.message });

    } catch (error) {
        res.status(500).json({ status: "Fail", message: error.message });
    }
};

module.exports = { signUp, signIn };

// const signUp = async (req, res) => {
//     try {
//         let { username, email, password, confirmpassword } = req.body;
//         if (!username || !email || !password || !confirmpassword) {
//             return res.status(400).json({ message: "All fields are required" });
//         }
//         if (password !== confirmpassword) {
//             return res.status(400).json({ message: "Passwords do not match" });
//         }

//         if (email.toLowerCase().includes("@admin")) {
//             return res.status(400).json({ message: "You cannot use an email that contains '@admin'" });
//         }


//         if((email.toLowerCase().includes("@ums-student"))){
//         let existingstudent = await Student.findOne({ email: email });
//         if (existingstudent) {
//             return res.status(400).json({ message: "Student with this email already exists" });
//         }
//         const newStudent = await Student.create({
//             username,
//             email,
//             password,
//         }) 
//          const token = JWT.sign(
//             { id: newStudent._id, username: newStudent.username },
//             process.env.JWT_SECRET,
//             { expiresIn: process.env.JWT_EXPIRATION });

//         res.status(201).json({
//             status: "Success",
//             data: { user: newStudent },
//             token: token,
//         });
//         }
//         else if(email.toLowerCase().includes("@ums-doctor"))
//         {
//             let existingdoctor = await Doctor.findOne({ email: email });
//             if (existingdoctor) {   
//                 return res.status(400).json({ message: "Doctor with this email already exists" });
//             }
//             const newDoctor = await Doctor.create({
//                 username,
//                 email,
//                 password,
//             })
//             const token = JWT.sign(
//                 { id: newDoctor._id, username: newDoctor.username },
//                 process.env.JWT_SECRET,
//                 { expiresIn: process.env.JWT_EXPIRATION }); 
//             res.status(201).json({
//                 status: "Success",
//                 data: { user: newDoctor },
//                 token: token,
//             });
//         }      
//         else {
//            return res.status(404).json({ message: "Invalid email domain for registration" });
//         }


       
//     } catch (error) {
//         res.status(400).json({ status: "Fail", message: error.message || "An error occurred" });

//     }
// }

// const signIn = async (req, res) => {
//     try {
//         const { email, password } = req.body;
//         if (!email || !password) {
//             return res.status(400).json({ message: "Email And Password Required" });
//         }

//         if (email.toLowerCase().includes("@admin")) {
//             const admin = await Admin.findOne({ email: email });

//             if (!admin) {
//                 return res.status(400).json({ message: "Invalid email or password" });
//             }
//             const isMatch = await bcrypt.compare(password, admin.password)
//             if (!isMatch) {
//                 return res.status(400).json({ message: "Invalid email or password" });
//             }

//             const token = JWT.sign(
//                 { id: admin._id, username: admin.username, role: "admin" },
//                 process.env.JWT_SECRET,
//                 { expiresIn: process.env.JWT_EXPIRATION }
//             );

//             res.status(200).json({
//                 status: "Success",
//                 data: { user: admin },
//                 token: token,
//             });
//         } else {
//             if (email.toLowerCase().includes("@ums-student")) {
//                 const student = await Student.findOne({ email: email });
//             if (!student) {
//                 return res.status(400).json({ message: "Invalid email or password" });
//             }
//             const isMatch = await bcrypt.compare(password, student.password)
//             if (!isMatch) {
//                 return res.status(400).json({ message: "Invalid email or password" });
//             }

//             const token = JWT.sign(
//                 { id: student._id, username: student.username, role: "student" },
//                 process.env.JWT_SECRET,
//                 { expiresIn: process.env.JWT_EXPIRATION }
//             );

//             res.status(200).json({
//                 status: "Success",
//                 data: { user: student },
//                 token: token,
//             });                
//             }
//             else if (email.toLowerCase().includes("@ums-doctor")) {
//                 const doctor = await Doctor.findOne({ email: email });
//                 if (!doctor) {
//                     return res.status(400).json({ message: "Invalid email or password" });
//                 }
//                 const isMatch = await bcrypt.compare(password, doctor.password)
//                 if (!isMatch) {
//                     return res.status(400).json({ message: "Invalid email or password" });
//                 }
//                 const token = JWT.sign(
//                     { id: doctor._id, username: doctor.username, role: "doctor" },
//                     process.env.JWT_SECRET,
//                     { expiresIn: process.env.JWT_EXPIRATION }
//                 );
//                 res.status(200).json({
//                     status: "Success",
//                     data: { user: doctor },
//                     token: token,
//                 });
//             }
//             else {
//                 return res.status(404).json({ message: "Invalid email domain for sign in" });
//             }          
            
//         }
//     } catch (error) {
//         res.status(400).json({ status: "Fail", message: error.message || "An error occurred" });
//     }

// }

// module.exports = {
//     signIn, signUp
// }