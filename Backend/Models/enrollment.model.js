const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    status: {
      type: String,
      enum: ["enrolled", "accepted", "failed", "succeeded", "pending" , "drop"],
      default: "enrolled",
    },
    grade: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);


const Enrollment =  mongoose.model("Enrollment", enrollmentSchema);
module.exports = Enrollment;