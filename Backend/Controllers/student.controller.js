const Student = require("../Models/student.model");
const Course = require("../Models/course.model");
const Enrollment = require("../Models/enrollment.model");
const mongoose = require("mongoose");
const JWT = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

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

        const {studentId, courseId} = req.body;
        
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        } 

        const course = await Course.findById(courseId);
        if(!course){
            return res.status(404).json({ message: "Course not found" });   
        }

        const exists = await Enrollment.findOne({ student: studentId, course: courseId });
        if(exists){
            return res.status(400).json({ message: "Student already enrolled in this course" });
        }

        const enrollment = await Enrollment.create({
            student: studentId,
            course: courseId,
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

    const student = await Student.findById(studentId);
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
        const { studentId , courseId } = req.body;

        const enrollment = await Enrollment.findOne({student: studentId , course: courseId});

        if (!enrollment) {
            return res.status(404).json({ message: "Enrollment not found" });
        }

        if (enrollment.status === "drop") {
            return res.status(400).json({ message: "Already requested to drop" });
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
};






module.exports = {
    viewCourses,
    enrollCourse,
    viewEnrolled,
    dropCourse
}