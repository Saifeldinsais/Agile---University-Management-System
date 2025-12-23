const pool = require("../Db_config/DB");
const fs = require("fs");
const path = require("path");

const uploadDir = path.join(__dirname, '../uploads');

const assignmentSubmissionService = {
  submitAssignment: async (student_id, assignment_id, files) => {
    try {
      if (!files || files.length === 0) {
        throw new Error("No files provided");
      }

      let [submission] = await pool.query(
        "SELECT * FROM assignment_submission_entity WHERE student_id = ? AND assignment_id = ?",
        [student_id, assignment_id]
      );

      let submissionId;
      if (!submission || submission.length === 0) {
        const [result] = await pool.query(
          "INSERT INTO assignment_submission_entity (student_id, assignment_id, status) VALUES (?, ?, 'submitted')",
          [student_id, assignment_id]
        );
        submissionId = result.insertId;
      } else {
        submissionId = submission[0].id;
        await pool.query(
          "UPDATE assignment_submission_entity SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP WHERE id = ?",
          [submissionId]
        );
      }

      await pool.query(
        "DELETE FROM assignment_submission_files WHERE assignment_submission_entity_id = ?",
        [submissionId]
      );

      for (const file of files) {
        await pool.query(
          "INSERT INTO assignment_submission_files (assignment_submission_entity_id, file_name, file_path, file_size, file_type) VALUES (?, ?, ?, ?, ?)",
          [submissionId, file.originalname, file.path, file.size, file.mimetype]
        );
      }

      return { success: true, submissionId };
    } catch (error) {
      throw error;
    }
  },

  getStudentAssignments: async (student_id) => {
    try {
      const [allAssignments] = await pool.query(
        `SELECT ae.entity_id, ae.entity_name as title, ae.created_at, ae.course_id
         FROM assignment_entity ae
         LIMIT 100`
      );

      const assignments = [];

      if (allAssignments && allAssignments.length > 0) {
        for (const assignment of allAssignments) {
          try {
            const [submission] = await pool.query(
              "SELECT * FROM assignment_submission_entity WHERE student_id = ? AND assignment_id = ?",
              [student_id, assignment.entity_id]
            );

            assignments.push({
              assignment_id: assignment.entity_id,
              course_id: assignment.course_id,
              title: assignment.title,
              created_at: assignment.created_at,
              status: (submission && submission.length > 0) ? submission[0].status : 'pending'
            });
          } catch (assignmentError) {
            console.error("Error checking submission for assignment", assignment.entity_id, assignmentError);
          }
        }
      }

      return assignments;
    } catch (error) {
      console.error("Error in getStudentAssignments:", error);
      return [];
    }
  },

  getSubmission: async (submission_id) => {
    try {
      const [submission] = await pool.query(
        "SELECT * FROM assignment_submission_entity WHERE id = ?",
        [submission_id]
      );

      if (!submission || submission.length === 0) {
        throw new Error("Submission not found");
      }

      const [files] = await pool.query(
        "SELECT * FROM assignment_submission_files WHERE assignment_submission_entity_id = ? ORDER BY uploaded_at DESC",
        [submission_id]
      );

      return {
        ...submission[0],
        files: files || []
      };
    } catch (error) {
      throw error;
    }
  },

  getAssignmentSubmissions: async (assignment_id) => {
    try {
      const [submissions] = await pool.query(
        "SELECT * FROM assignment_submission_entity WHERE assignment_id = ? ORDER BY submitted_at DESC",
        [assignment_id]
      );

      const result = [];
      for (const submission of submissions || []) {
        const [files] = await pool.query(
          "SELECT * FROM assignment_submission_files WHERE assignment_submission_entity_id = ?",
          [submission.id]
        );

        result.push({
          ...submission,
          files: files || []
        });
      }

      return result;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = assignmentSubmissionService;
