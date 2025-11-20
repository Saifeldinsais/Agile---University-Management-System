const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
    required: true,
  },
  start: {
    type: String, // "09:00"
    required: true,
  },
  end: {
    type: String, // "11:00"
    required: true,
  },
  doctorEmail: {
    type: String,
    required: true,
  },
});

const classroomSchema = new mongoose.Schema({
  roomName: {
    type: String,
    required: [true, "Room name is required"],
    trim: true,
    maxlength: [4, "Room name must be at most 4 characters long"],
  },
  capacity: {
    type: Number,
    required: [true, "The room capacity is required"],
    max: [200, "Capacity should be maximum 200"],
    min: [10, "Capacity should be at least 1"],
  },
  type: {
    type: String,
    enum: ["hall", "lab"],
    required: [true, "Type is required"],
  },

  // ✅ NEW: full schedule with doctor per slot
  timeSlots: {
    type: [timeSlotSchema],
    default: [],
  },

  // your existing fields (keep them)
  bookedSchedule: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isWorking: {
    type: Boolean,
    default: true,
  },
  requested_by: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
  ],
});

const Classroom = mongoose.model("Classrooms", classroomSchema);
module.exports = Classroom;
