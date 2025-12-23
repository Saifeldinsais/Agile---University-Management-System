import { apiClient } from "./apiClient";

const StudentService = {

  viewCourses: () => {
    return apiClient.get("/student/viewCourses");
  },


  viewEnrolled: (studentId) => {
    return apiClient.get(`/student/enrolled/${studentId}`);
  },


  enrollCourse: (studentId, courseId) => {
    return apiClient.post("/student/enroll", {
      studentId,
      courseId,
    });
  },


  dropCourse: (studentId, courseId) => {
    return apiClient.put("/student/dropCourse", {
      studentId,
      courseId,
    });
  },

  // Get student profile data
  getStudentProfile: (studentId) => {
    return apiClient.get(`/student/${studentId}/profile`);
  },

  // Get student statistics (GPA, credits, etc.)
  getStudentStats: (studentId) => {
    return apiClient.get(`/student/${studentId}/stats`);
  },
};

export default StudentService;
