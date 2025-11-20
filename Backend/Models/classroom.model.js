const mongoose = require("mongoose");

const classroomSchema = new mongoose.Schema({
    roomName: {
        type: String,
        required: [true, "Room name is required"],
        trim: true,
        maxlength: [4, "Room name must be at most 4 characters long"]
    },
    capacity: {
        type: Number,
        required: [true, "The room capacity is required"],
        max: [200, "Capacity should be maximum 200"],
        min: [10, "Capacity should be at least 1"]
    },
    type: {
        type: String,
        enum: ["hall", "lab"],
        required: [true, "Type is required"]
    },
    availabilitySchedule: {
        type: [String],  // ["Mon 09:00-11:00", "Wed 14:00-16:00", "Fri 08:00-10:00"]
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    isbooked: {
        type: Boolean,
        default: false
    },
    requested_by: [{                
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctors",
    }]
    });

const Classroom = mongoose.model("Classrooms", classroomSchema);
module.exports = Classroom;