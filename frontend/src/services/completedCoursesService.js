import axios from "axios";
import { API_BASE_URL } from "./config";

const CompletedCoursesService = {
  // Get completed courses with final grades and GPA
  getCompletedCoursesWithGrades: async (studentId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/student/completed-courses/${studentId}`
      );
      return {
        status: 200,
        data: response.data,
      };
    } catch (error) {
      throw {
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  // Update enrollment with final grade and mark as completed
  updateEnrollmentWithFinalGrade: async (enrollmentId, finalGrade, completionStatus = "completed") => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/student/enrollment/final-grade`,
        {
          enrollmentId,
          finalGrade,
          completionStatus,
        }
      );
      return {
        status: 200,
        data: response.data,
      };
    } catch (error) {
      throw {
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  // Calculate GPA from completed courses
  calculateGPA: (completedCourses) => {
    if (!completedCourses || completedCourses.length === 0) {
      return 0;
    }

    let totalGradePoints = 0;
    let totalCredits = 0;

    completedCourses.forEach((course) => {
      const credits = parseInt(course.credits) || 0;
      const grade = parseFloat(course.finalGrade) || 0;
      totalGradePoints += grade * credits;
      totalCredits += credits;
    });

    return totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;
  },

  // Get grade label from score
  getGradeLabel: (score) => {
    const numScore = parseFloat(score) || 0;
    if (numScore >= 90) return "A";
    if (numScore >= 80) return "B";
    if (numScore >= 70) return "C";
    if (numScore >= 60) return "D";
    return "F";
  },

  // Get grade color based on score
  getGradeColor: (score) => {
    const numScore = parseFloat(score) || 0;
    if (numScore >= 90) return "#27ae60"; // Green - A
    if (numScore >= 80) return "#3498db"; // Blue - B
    if (numScore >= 70) return "#f39c12"; // Orange - C
    if (numScore >= 60) return "#e74c3c"; // Red - D
    return "#95a5a6"; // Gray - F
  },
};

export default CompletedCoursesService;
