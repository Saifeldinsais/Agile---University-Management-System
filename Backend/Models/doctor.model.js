const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs")

const doctorSchema = mongoose.Schema({
    username  : {
        type: String,
        required: [true, "Username is required"],
        unique: true,
        trim: true,
    maxlength : [40, "Username must be at most 40 characters long"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
        validate: [validator.isEmail,"Please provide a valid email address"]
    },
    password  : {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"]
    },
    createdAt : {
        type: Date,
        default: Date.now
    },
    courses :[{type: mongoose.Schema.Types.ObjectId, ref: "Course"}],
    department: {String},

});

doctorSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const Doctor = mongoose.model("Doctor",doctorSchema);
module.exports = Doctor;