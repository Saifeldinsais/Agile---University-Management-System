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

  getAvailableElectives: () => {
    return apiClient.get("/student/electives");
  },

  selectElective: (courseId) => {
    return apiClient.post("/student/selectElective", {
      courseId,
    });
  },

  getTimetable: () => {
    return apiClient.get("/student/timetable");
  },
};

export default StudentService;
