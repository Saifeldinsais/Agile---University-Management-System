const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const assignmentSubmissionController = require('../Controllers/assignmentSubmission.controller');
const { authenticateToken } = require('../Utils/authMiddleware');

const uploadDir = path.join(__dirname, '../uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}_${timestamp}_${random}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/submit', authenticateToken, upload.array('files', 5), assignmentSubmissionController.submitAssignment);
router.get('/student-assignments', authenticateToken, assignmentSubmissionController.getStudentAssignments);
router.get('/:submission_id', authenticateToken, assignmentSubmissionController.getSubmission);
router.get('/assignment/:assignment_id/submissions', authenticateToken, assignmentSubmissionController.getAssignmentSubmissions);

module.exports = router;
