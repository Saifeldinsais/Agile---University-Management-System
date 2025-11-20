const doctor = require("../Models/doctor.model");
const mongoose = require("mongoose");
const Course = require("../Models/course.model");
const Enrollment = require("../Models/enrollment.model");
const Classroom = require("../Models/classroom.model");

const bookClassroom = async (req, res) => { 
    try {
        const { doctorId ,classroomId, timeSlot } = req.body;
        if (!classroomId || !timeSlot || !doctorId) {
            return res.status(400).json({ message: "DoctorId , classroomID and time slot are required" });
        } ;
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) {
            return res.status(404).json({ message: "Classroom not found" });
        }   
        if (classroom.isbooked) {
            return res.status(400).json({ message: "Classroom is already booked" });
        }   
        if (!classroom.availabilitySchedule.includes(timeSlot)) {
            return res.status(400).json({ message: "Time slot not available" });
        }
        classroom.requested_by.push(doctorId);
        await classroom.save();
        res.status(200).json({ message: "Classroom booking request sent to admin for approval" });
    } catch (error) {
        res.status(500).json({ message: "Error booking classroom", error });
    }   
};

module.exports = {
    bookClassroom,
};
