const express = require("express");
const router = express.Router();
const advisorController = require("../Controllers/advisor.controller");

// ================= ADVISOR ASSIGNMENT =================
// Check if user is an advisor
router.get("/check/:userId", advisorController.checkIsAdvisor);

// Get advisor's assigned department
router.get("/:userId/department", advisorController.getAdvisorDepartment);

// Assign advisor to department
router.post("/assign", advisorController.assignAdvisorToDepartment);

// Remove advisor assignment
router.delete("/:userId/assignment", advisorController.removeAdvisorAssignment);

// ================= DEPARTMENT DATA =================
// Get courses in advisor's department
router.get("/:userId/courses", advisorController.getDepartmentCourses);

// Get students enrolled in advisor's department courses
router.get("/:userId/students", advisorController.getDepartmentStudents);

// Get specific student's courses within advisor's department
router.get("/:userId/students/:studentId/courses", advisorController.getStudentCoursesInDepartment);

// Get department statistics
router.get("/:userId/stats", advisorController.getDepartmentStats);

module.exports = router;
