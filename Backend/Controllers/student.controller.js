const Student = require("../Models/student.model");
const Course = require("../Models/course.model");
const Enrollment = require("../Models/enrollment.model");
const mongoose = require("mongoose");
const JWT = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const signUp = async(req,res)=>{
    try{
        let {username,email,password,confirmpassword} = req.body;
        if(!username || !email || !password || !confirmpassword){
            return res.status(400).json({message : "All fields are required"});
        }
        if(password !== confirmpassword){
            return res.status(400).json({message : "Passwords do not match"});
        }   

        if (email.toLowerCase().includes("@admin")) {
            return res.status(400).json({ message: "You cannot use an email that contains '@admin'" });
        }

        let existingstudent = await Student.findOne({email:email});
        if(existingstudent){
            return res.status(400).json({message : "Student with this email already exists"});
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
            data: { user: newStudent  },
            token: token,
        });
    }catch(error){
        res.status(400).json({ status: "Fail", message: error.message || "An error occurred" });

    }
}

const signIn = async(req,res) => {
    try{
        const {email , password} = req.body;
        if(!email || !password){
            return res.status(400).json({message: "Email And Password Required"});
        }
        const student = await Student.findOne({email:email});
        if(!student){
            return res.status(400).json({message: "Invalid email or password"});
        }
        const isMatch = await bcrypt.compare(password , student.password)
        if(!isMatch){
            return res.status(400).json({message: "Invalid email or password"});
        }

        const token = JWT.sign(
            { id: student._id, username: student.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION }
        );

        res.status(200).json({
            status: "Success",
            data: { user: student},
            token: token,
        });

    }catch(error){
        res.status(400).json({ status: "Fail" , message: error.message || "An error occurred"});
    }

}

const viewCourses = async(req,res) => {
    try{
        const courses = await Course.find();
        res.status(200).json(courses);
    }catch(error){
        res.status(500).json({ message: "Error fetching courses", error });
    }
}

const enrollCourse = async(req,res) => {
    try{

        const {studentID, courseID} = req.body;
        
        const student = await Student.findById(studentID);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        } 

        const course = await Course.findOne(courseID);
        if(!course){
            return res.status(404).json({ message: "Course not found" });   
        }

        const exists = await Enrollment.findOne({ student: studentID, course: courseID });
        if(exists){
            return res.status(400).json({ message: "Student already enrolled in this course" });
        }

        const enrollment = await Enrollment.create({
            student: studentID,
            course: courseID,
            status: "pending",
        });

        res.status(201).json({
            message: "Student enrolled successfully",
            enrollment,
        });

    }catch(error){
        res.status(500).json({
            message: "Error enrolling student",
            error,
        });
    }
}

const viewEnrolled = async(req,res) => {
    try {
    const { studentId } = req.params; 

    const student = await Student.findById(studentID);
    if (!student) {
        return res.status(404).json({ message: "Student not found" });
    } 

    const enrolledCourses = await Enrollment.find({ student: studentId })
      .populate("course")   
      .populate("student")  
      .exec();

    if (!enrolledCourses || enrolledCourses.length === 0) {
      return res.status(404).json({
        message: "No enrolled courses found for this student"
      });
    }

    res.status(200).json({
      message: "Enrolled courses fetched successfully",
      courses: enrolledCourses
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching enrolled courses",
      error
    });
  }
}

const dropCourse = async(req,res) => {
    try {
        const { studentID , courseID } = req.body;

        const enrollment = await Enrollment.findOne({studentID , courseID});

        if (!enrollment) {
            return res.status(404).json({ message: "Enrollment not found" });
        }

        enrollment.status = "drop";
        await enrollment.save();

        res.status(200).json({
            message: "Course status updated to dropped",
            enrollment
        });

    } catch (error) {
        res.status(500).json({
            message: "Error updating course status",
            error,
        });
    }
}




module.exports = {
    signUp,
    signIn,
    viewCourses,
    enrollCourse,
    viewEnrolled,
    dropCourse
}