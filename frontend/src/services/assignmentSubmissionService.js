import { apiClient } from './apiClient';

const assignmentSubmissionService = {
  submitAssignment: async (assignmentId, files) => {
    const formData = new FormData();
    formData.append('assignment_id', assignmentId);
    files.forEach(file => {
      formData.append('files', file);
    });
    const response = await apiClient.post('/assignmentsubmission/submit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getStudentAssignments: async () => {
    const response = await apiClient.get('/assignmentsubmission/student-assignments');
    return response.data;
  },

  getSubmission: async (submissionId) => {
    const response = await apiClient.get(`/assignmentsubmission/${submissionId}`);
    return response.data;
  },

  getAssignmentSubmissions: async (assignmentId) => {
    const response = await apiClient.get(`/assignmentsubmission/assignment/${assignmentId}/submissions`);
    return response.data;
  }
};

export default assignmentSubmissionService;
