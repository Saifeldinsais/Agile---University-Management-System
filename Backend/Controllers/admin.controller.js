const Classroom = require("../Models/classroom.model");
const courseService = require("../Services/course.service");
const Doctor = require("../Models/doctor.model");
const JWT = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const enrollmentService = require("../Services/enrollment.service");
const Student = require("../Models/student.model");

const adminService = require("../Services/admin.service");
const createClassroom = async (req, res) => {
  try {
    const { roomName, capacity, type, isworking, timeslots } = req.body;

    // Validate required fields
    if (!roomName || capacity == null || !type || isworking == null) {
      return res.status(400).json({
        status: "fail",
        message: "roomName, capacity, type, and isworking are required",
      });
    }

    // Optional: check timeslots is an array if provided
    if (timeslots && !Array.isArray(timeslots)) {
      return res.status(400).json({
        status: "fail",
        message: "timeslots must be an array of strings",
      });
    }

    // Check for existing classroom
    const existingClassroom = await adminService.getClassroomByName(roomName);
    if (existingClassroom) {
      return res.status(400).json({
        status: "fail",
        message: "Classroom with this roomName already exists",
      });
    }

    // Create classroom (pass timeslots array directly)
    const result = await adminService.createClassroom({
      roomName,
      capacity,
      type,
      isworking,
      timeslots, // can be undefined or array
    });

    if (!result.success) {
      return res.status(400).json({
        status: "fail",
        message: result.message,
      });
    }

    res.status(201).json({
      status: "success",
      data: {
        classroom: {
          id: result.id,
          roomName,
          capacity,
          type,
          isworking,
          timeslots: timeslots || [],
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to create classroom",
      error: error.message,
    });
  }
};

const getClassrooms = async (req, res) => {
  try {
    const result = await adminService.getClassroom();

    if (!result.success) {
      return res.status(500).json({
        status: "error",
        message: result.message,
      });
    }

    res.status(200).json({
      status: "success",
      results: result.classrooms.length,
      data: { classrooms: result.classrooms },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch classrooms",
      error: error.message,
    });
  }
};

const updateClassroom = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // At minimum, expect some fields to update — but allow partial updates
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        status: "fail",
        message: "No update data provided",
      });
    }
    const result = await adminService.updateClassroom(parseInt(id), updateData);

    if (!result.success) {
      return res.status(400).json({
        status: "fail",
        message: result.message,
      });
    }

    res.status(200).json({
      status: "success",
      message: "Classroom updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to update classroom",
      error: error.message,
    });
  }
};

const deleteClassroom = async (req, res) => {
  try {
    const classroom = await adminService.getClassroomById(req.params.id)

    if (!classroom) {
      return res.status(404).json({ status: "fail", message: "Classroom not found" })
    }
    const result = await adminService.deleteClassroom(req.params.id)

    if (!result.success) {
      return res.status(400).json({ status: "fail", message: result.message })
    }
    res.status(200).json({ status: "success", message: "Classroom deleted successfully" })
  }
  catch (error) {
    res.status(500).json({ status: "error", message: error.message })
  }
}

const getClassroomStatus = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)

    if (!classroom) {
      return res.status(404).json({ status: "fail", message: "Classroom not found" })
    }

    const status = classroom.isWorking ? "working" : "not working";

    res.status(200).json({ status: "success", data: { classroom, status, bookedDate: classroom.bookedSchedule, requestedBy: classroom.requested_by } })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}


//==================== courses functions =========================


const createCourse = async (req, res) => {
  try {
    const { title, code, description, credits, department } = req.body;

    if (!title || !code || credits == null || !department) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    const result = await courseService.create({
      title,
      code,
      description: description || "",
      credits: Number(credits),
      department,
    });

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    return res.status(201).json({
      status: "Success",
      data: { courseId: result.id },
    });
  } catch (error) {
    return res.status(500).json({
      status: "Fail",
      message: error.message || "An error occurred",
    });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const courseId = Number(req.params.id);

    const ok = await courseService.delete(courseId);
    if (!ok) {
      return res.status(404).json({ status: "fail", message: "Course not found" });
    }

    const courses = await courseService.getAll();
    return res.status(200).json({ status: "success", data: courses });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message || "An error occurred" });
  }
};



const updateCourse = async (req, res) => {
  try {
    const courseId = Number(req.params.id);

    const ok = await courseService.update(courseId, {
      title: req.body.title,
      code: req.body.code,
      description: req.body.description,
      credits: req.body.credits != null ? Number(req.body.credits) : undefined,
      department: req.body.department,
    });

    if (!ok) {
      return res.status(404).json({ status: "fail", message: "Course not found" });
    }

    return res.status(200).json({ status: "success", message: "Course updated" });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message || "An error occurred" });
  }
};


const getCourses = async (req, res) => {
  try {
    const result = await courseService.getAll(); // returns array
    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message || "An error occurred",
    });
  }
};



//==================== assgining functions ==============================

const assignClassroom = async (req, res) => {
  try {
    const { timeSlot, doctorId } = req.body;
    const classroomId = req.params.id;

    if (!timeSlot || !doctorId || !classroomId) {
      return res.status(400).json({
        status: "fail",
        message: "timeSlot, doctorId and classroomId are required",
      });
    }


    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ status: "fail", message: "Classroom not found" })
    }

    if (classroom.isWorking === false) {
      return res.status(400).json({ status: "fail", message: "classroom is not working currently" })
    }

    if (classroom.bookedSchedule.includes(timeSlot)) {
      return res.status(400).json({ status: "fail", message: "classroom not available at this time slot" })
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ status: "fail", message: "Doctor not found" })
    }

    classroom.bookedSchedule.push(timeSlot)
    classroom.requested_by.push(doctorId)
    await classroom.save();
    return res.status(200).json({ status: "success", data: classroom })

  }
  catch (error) {
    res.status(500).json({
      status: 'error', message: error.message
    })
  }
}

const unassignClassroom = async (req, res) => {
  try {
    const { timeSlot, doctorId } = req.body;
    const classroomId = req.params.id;

    if (!timeSlot || !doctorId || !classroomId) {
      return res.status(400).json({
        status: "fail",
        message: "timeSlot, doctorId and classroomId are required",
      });
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ status: "fail", message: "Classroom not found" })
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ status: "fail", message: "Doctor not found" })
    }

    const assignedSlot = classroom.bookedSchedule.indexOf(timeSlot);
    if (assignedSlot === -1) {
      return res.status(400).json({ status: "fail", message: "classroom is not assigned at this time slot" })
    }

    if (classroom.requested_by[assignedSlot].toString() !== doctorId) { // check kda 34an n4oof el7eta ely t7t deeh ynf3 n3mlha wla fe 7aga 8lt feldb (htfeed feltest)
      return res.status(400).json({ status: "fail", message: "This timeslot's doctor doesn't match the doctor id" })
    }

    classroom.bookedSchedule.splice(assignedSlot, 1);
    classroom.requested_by.splice(assignedSlot, 1) // kda kda e7na 3mleen push leldoctor id m3 eltimeslot fa eletneen nfs elindex

    await classroom.save();
    return res.status(200).json({ status: "success", data: classroom })

  } catch (error) {
    res.status(500).json({
      status: 'error', message: error.message
    })
  }


}


const assignCourseToDoctor = async (req, res) => {
  try {
    const courseId = req.params.id;
    const { doctorId } = req.body;

    if (!courseId || !doctorId) {
      return res.status(400).json({ status: "fail", message: "course ID and Doctor Id is required" })
    }

    const course = await Course.findById(courseId);
    const doctor = await Doctor.findById(doctorId);

    if (!course) {
      return res.status(404).json({ status: "fail", message: "Course not found" })
    }

    if (!doctor) {
      return res.status(404).json({ status: "fail", message: "Doctor not found" })
    }

    if (!doctor.courses.includes(courseId)) {
      doctor.courses.push(courseId)
      await doctor.save()
    }

    res.status(200).json({ status: "success", data: doctor })

  } catch (error) {
    res.status(500).json({
      status: 'error', message: error.message
    })
  }
}

const unassignCourseFromDoctor = async (req, res) => {
  try {
    const courseId = req.params.id;
    const { doctorId } = req.body;

    if (!courseId || !doctorId) {
      return res.status(400).json({ status: "fail", message: "course ID and Doctor Id is required" })
    }

    const course = await Course.findById(courseId);
    const doctor = await Doctor.findById(doctorId);

    if (!course) {
      return res.status(404).json({ status: "fail", message: "Course not found" })
    }

    if (!doctor) {
      return res.status(404).json({ status: "fail", message: "Doctor not found" })
    }

    if (!doctor.courses.includes(courseId)) {
      return res.status(400).json({ status: "fail", message: "This course is not assigned to this doctor" })
    }

    const courseIndex = doctor.courses.indexOf(courseId)
    doctor.courses.splice(courseIndex, 1);
    await doctor.save()
    res.status(200).json({ status: "success", data: doctor })

  } catch (error) {
    res.status(500).json({
      status: 'error', message: error.message
    })
  }
}


// Add time slot to a classroom
const addTimeSlot = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { day, start, end, doctorEmail } = req.body;

    if (!day || !start || !end || !doctorEmail) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const classroom = await Classroom.findById(roomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // prevent overlapping in same day
    const conflict = classroom.timeSlots.some((slot) => {
      if (slot.day !== day) return false;
      // if new range overlaps existing
      return !(end <= slot.start || start >= slot.end);
    });

    if (conflict) {
      return res
        .status(400)
        .json({ message: "Time slot conflicts with existing schedule" });
    }

    classroom.timeSlots.push({ day, start, end, doctorEmail });
    await classroom.save();

    res.status(201).json({
      status: "success",
      data: { classroom },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding time slot" });
  }
};

// Edit (update) time slot
const updateTimeSlot = async (req, res) => {
  try {
    const { roomId, slotId } = req.params;
    const { day, start, end, doctorEmail } = req.body;

    const classroom = await Classroom.findById(roomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    const slot = classroom.timeSlots.id(slotId);
    if (!slot) {
      return res.status(404).json({ message: "Time slot not found" });
    }

    // check conflict with OTHER slots
    const conflict = classroom.timeSlots.some((s) => {
      if (s._id.toString() === slotId) return false;
      if (s.day !== day) return false;
      return !(end <= s.start || start >= s.end);
    });

    if (conflict) {
      return res
        .status(400)
        .json({ message: "Time slot conflicts with existing schedule" });
    }

    slot.day = day;
    slot.start = start;
    slot.end = end;
    slot.doctorEmail = doctorEmail;
    await classroom.save();

    res.json({
      status: "success",
      data: { classroom },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating time slot" });
  }
};

// Delete time slot
const deleteTimeSlot = async (req, res) => {
  try {
    const { roomId, slotId } = req.params;

    const classroom = await Classroom.findById(roomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    classroom.timeSlots = classroom.timeSlots.filter(
      (slot) => slot._id.toString() !== slotId
    );
    await classroom.save();

    res.json({
      status: "success",
      data: { classroom },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting time slot" });
  }
};
// View enrolled courses and accept/decline enrollment requests

const acceptEnrollments = async (req, res) => {
  try {
    const { student } = req.params;
    const enrollments = await Enrollment.find({ student: student, status: "pending" });

    if (!enrollments || enrollments.length === 0) {
      return res.status(404).json({ message: "No pending enrollments found for this student" });
    }


    await Enrollment.updateMany(
      { student: student, status: "pending" },
      { status: "accepted" }
    );
    const addtoliststudent = await Student.findById(req.params.student);
    addtoliststudent.courses.push(...enrollments.map(enrollment => enrollment.course));
    await addtoliststudent.save();


    const updated = await Enrollment.find({ student: student, status: "accepted" });

    res.status(200).json({
      status: "success",
      data: { enrollments: updated },
    });
  } catch (error) {
    res.status(500).json({ message: "Error managing enrollments", error: error.message });
  }
}

const rejectEnrollments = async (req, res) => {
  try {
    const { student } = req.params;
    const enrollments = await Enrollment.find({ student: student, status: "pending" });

    if (!enrollments || enrollments.length === 0) {
      return res.status(404).json({ message: "No pending enrollments found for this student" });
    }

    // Update all pending enrollments to failed
    await Enrollment.updateMany(
      { student: student, status: "pending" },
      { status: "failed" }
    );

    const updated = await Enrollment.find({ student: student, status: "failed" });

    res.status(200).json({
      status: "success",
      data: { enrollments: updated },
    });
  } catch (error) {
    res.status(500).json({ message: "Error managing enrollments", error: error.message });
  }
};
//=======================================================================================


// Retrieving all students records

const getStudents = async (req, res) => {
  try {
    const students = await adminService.getallStudents();
    res.status(200).json({
      status: "success",
      results: students.length,
      data: students
    });
  }
  catch (error) {
    res.status(500).json({ message: "Failed to retrieve students", error: error.message });
  }
};

module.exports = {
  getCourses, updateTimeSlot, deleteTimeSlot, addTimeSlot, createClassroom, getClassrooms, updateClassroom, deleteClassroom, createCourse, deleteCourse, getClassroomStatus, assignClassroom, unassignClassroom, updateCourse, assignCourseToDoctor, unassignCourseFromDoctor, acceptEnrollments, rejectEnrollments, getStudents
}