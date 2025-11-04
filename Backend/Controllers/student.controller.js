const Student = require("../Models/student.model");
const mongoose = require("mongoose");
const JWT = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const signup = async(req,res)=>{
    try{
        let {username,email,password,confirmpassword} = req.body;
        if(!username || !email || !password || !confirmpassword){
            return res.status(400).json({message : "All fields are required"});
        }
        if(password !== confirmpassword){
            return res.status(400).json({message : "Passwords do not match"});
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


        const token = JWT.sign({ password: newStudent.password, username: newStudent.username }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });
        res.status(201).json({
            status: "Success",
            data: { user: newStudent  },
            token: token,
        });
    }catch(error){
        res.status(400).json({ status: "Fail", message: error.message || "An error occurred" });

    }
}
module.exports = {
    signup
}