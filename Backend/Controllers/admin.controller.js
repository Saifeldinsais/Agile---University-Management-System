const Classroom = require("../Models/classroom.model");
const Admin = require("../Models/admin.model");
const Course = require("../Models/course.model");
const JWT = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// const signUp = async(req,res)=>{     // to create an admin only then delete it  the admins don't sign up in website
//     try{   
//         let {username,email,password,confirmpassword} = req.body;
//         if(!username || !email || !password || !confirmpassword){
//             return res.status(400).json({message : "All fields are required"});
//         }
//         if(password !== confirmpassword){
//             return res.status(400).json({message : "Passwords do not match"});
//         }   
//         let existingadmin = await Admin.findOne({email:email});
//         if(existingadmin){
//             return res.status(400).json({message : "Admin with this email already exists"});
//         }
//         const newAdmin = await Admin.create({
//             username,
//             email,
//             password,            
//         })
//         const token = JWT.sign(
//             { password: newAdmin.password, username: newAdmin.username }, 
//             process.env.JWT_SECRET, 
//             { expiresIn: process.env.JWT_EXPIRATION });

//         res.status(201).json({
//             status: "Success",
//             data: { user: newAdmin  },
//             token: token,
//         });
//     }catch(error){
//         res.status(400).json({ status: "Fail", message: error.message || "An error occurred" });

//     }
// }

const signIn = async(req,res) => {
    try{
        const {email , password} = req.body;
        if(!email || !password){
            return res.status(400).json({message: "Email And Password Required"});
        }
        const admin = await Admin.findOne({email:email});
        if(!admin){
            return res.status(401).json({message: "Invalid email or password"});
        }
        const isMatch = await bcrypt.compare(password , admin.password)
        if(!isMatch){
            return res.status(402).json({message: "Invalid email or password"});
        }

        const token = JWT.sign(
            { id: admin._id, username: admin.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION }
        );

        res.status(200).json({
            status: "Success",
            data: { user: admin},
            token: token,
        });

    }catch(error){
        res.status(400).json({ status: "Fail" , message: error.message || "An error occurred"});
    }

}

const createClassroom = async (req, res) => {
    try {
        const { roomName, capacity, type, equipment, availabilitySchedule } = req.body;
        if (!roomName || !capacity || !type) {
            return res.status(400).json({ message: "Required fields are missing" });
        }
        const existingClassroom = await Classroom.findOne({ roomName: roomName });
        if (existingClassroom) {
            return res.status(400).json({ message: "Classroom with this name already exists" });
        }
        const classroom = await Classroom.create({
            roomName,
            capacity,
            type,
            equipment,
            availabilitySchedule,
        });

        res.status(200).json({
            status: "success", data: classroom
        });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to create the classroom", error: error.message });
    }
}

const getClassrooms = async (req, res) => {
    try {
        const classrooms = await Classroom.find();

        res.status(200).json({
            status: "success", results: classrooms.length, data: classrooms
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const updateClassroom = async (req, res) => {
    try {
        const classroom = await Classroom.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        if (!classroom) {
            return res.status(404).json({ status: "fail", message: "classroom not found" })
        }

        res.status(200).json({ status: "success", data: classroom })
    }
    catch (error) {
        res.status(500).json({ status: "error", message: error.message })
    }
}

const deleteClassroom = async (req, res) => {
    try {

        const deleted = await Classroom.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ status: "fail", message: "Classroom not found"});
        }

        const classrooms = await Classroom.find(); 

        res.status(200).json({ status: "success", data: classrooms })
    }
    catch (error) {
        res.status(500).json({ status: "error", message: error.message })
    }
}


const createCourse = async (req,res)=>{
    try{
         const{title,code,description,credits,department} = req.body;
         if(!title || !code || !credits || !department){
            return res.status(400).json({message: "Required fields are missing"});
         }

         const existingCourse = await Course.findOne({code:code});
         if(existingCourse){
            return res.status(400).json({message: "Course with this code already exists"});
         }
            const newCourse = await Course.create({
                title,
                code,
                description,
                credits,
                department
            }); 
        res.status(201).json({
            status: "Success",
            data: { course: newCourse  },
        });

    }catch(error){
        res.status(400).json({ status: "Fail", message: error.message || "An error occurred" });
    }
   

}

const deleteCourse = async(req,res)=>{
   try{
    const deletedcourse = await Course.findByIdAndDelete(req.params.id);

    if(!deletedcourse){
        return res.status(404).json({status: "fail", message: "Course not found"});
    }
    const courses = await Course.find();

    res.status(200).json({status: "success", data: courses})
   }catch(error){
        res.status(400).json({ status: "Fail", message: error.message || "An error occurred" });
    }
}

module.exports = {
    createClassroom, getClassrooms, updateClassroom, deleteClassroom ,signIn , createCourse , deleteCourse
}