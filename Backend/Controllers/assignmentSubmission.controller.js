const assignmentSubmissionService = require("../Services/assignmentSubmission.service");
const fs = require("fs");

const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const submitAssignment = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'student') {
      if (req.files) {
        req.files.forEach(f => {
          try {
            fs.unlinkSync(f.path);
          } catch (e) {}
        });
      }
      return res.status(403).json({ status: 'fail', message: 'Only students can submit assignments' });
    }

    const { assignment_id } = req.body;
    if (!assignment_id || !req.files || req.files.length === 0) {
      if (req.files) {
        req.files.forEach(f => {
          try {
            fs.unlinkSync(f.path);
          } catch (e) {}
        });
      }
      return res.status(400).json({ status: 'fail', message: 'Assignment ID and files are required' });
    }

    const validationErrors = [];
    for (const file of req.files) {
      if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
        validationErrors.push(`File ${file.originalname} has unsupported format. Allowed: JPG, PNG, PDF`);
      }
      if (file.size > MAX_FILE_SIZE) {
        validationErrors.push(`File ${file.originalname} exceeds 10MB limit`);
      }
    }

    if (validationErrors.length > 0) {
      req.files.forEach(f => {
        try {
          fs.unlinkSync(f.path);
        } catch (e) {}
      });
      return res.status(400).json({ status: 'fail', message: 'File validation failed', errors: validationErrors });
    }

    const submissionId = await assignmentSubmissionService.submitAssignment(user.id, assignment_id, req.files);
    res.status(200).json({ status: 'success', message: 'Assignment submitted successfully', submissionId });
  } catch (error) {
    if (req.files) {
      req.files.forEach(f => {
        try {
          fs.unlinkSync(f.path);
        } catch (e) {}
      });
    }
    res.status(500).json({ status: 'fail', message: error.message });
  }
};

const getStudentAssignments = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'student') {
      return res.status(403).json({ status: 'fail', message: 'Only students can view assignments' });
    }

    const assignments = await assignmentSubmissionService.getStudentAssignments(user.id);
    res.status(200).json({ status: 'success', data: assignments });
  } catch (error) {
    console.error("Error in getStudentAssignments controller:", error);
    res.status(500).json({ status: 'fail', message: error.message });
  }
};

const getSubmission = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'student') {
      return res.status(403).json({ status: 'fail', message: 'Only students can view submissions' });
    }

    const { submission_id } = req.params;
    if (!submission_id) {
      return res.status(400).json({ status: 'fail', message: 'Submission ID is required' });
    }

    const submission = await assignmentSubmissionService.getSubmission(submission_id);
    if (submission.student_id !== user.id) {
      return res.status(403).json({ status: 'fail', message: 'You can only view your own submissions' });
    }

    res.status(200).json({ status: 'success', data: submission });
  } catch (error) {
    res.status(500).json({ status: 'fail', message: error.message });
  }
};

const getAssignmentSubmissions = async (req, res) => {
  try {
    const user = req.user;
    if (!user || (user.role !== 'staff' && user.role !== 'doctor')) {
      return res.status(403).json({ status: 'fail', message: 'Only instructors can view assignment submissions' });
    }

    const { assignment_id } = req.params;
    if (!assignment_id) {
      return res.status(400).json({ status: 'fail', message: 'Assignment ID is required' });
    }

    const submissions = await assignmentSubmissionService.getAssignmentSubmissions(assignment_id);
    res.status(200).json({ status: 'success', data: submissions });
  } catch (error) {
    res.status(500).json({ status: 'fail', message: error.message });
  }
};

module.exports = {
  submitAssignment,
  getStudentAssignments,
  getSubmission,
  getAssignmentSubmissions
};
