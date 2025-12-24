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
          "INSERT INTO assignment_submission_entity (student_id, assignment_id) VALUES (?, ?)",
          [student_id, assignment_id]
        );
        submissionId = result.insertId;
      } else {
        submissionId = submission[0].entity_id;
      }

      // Set submission_status attribute to 'submitted' in EAV
      // Get attribute_id for 'submission_status'
      const [[attrRow]] = await pool.query(
        "SELECT attribute_id FROM assignment_submission_attributes WHERE attribute_name = 'submission_status' LIMIT 1"
      );
      const statusAttrId = attrRow?.attribute_id;
      if (statusAttrId) {
        // Upsert value
        const [[existing]] = await pool.query(
          "SELECT value_id FROM assignment_submission_entity_attribute WHERE entity_id = ? AND attribute_id = ? LIMIT 1",
          [submissionId, statusAttrId]
        );
        if (existing?.value_id) {
          await pool.query(
            "UPDATE assignment_submission_entity_attribute SET value_string = ? WHERE value_id = ?",
            ['submitted', existing.value_id]
          );
        } else {
          await pool.query(
            "INSERT INTO assignment_submission_entity_attribute (entity_id, attribute_id, value_string) VALUES (?, ?, ?)",
            [submissionId, statusAttrId, 'submitted']
          );
        }
      }

      await pool.query(
        "DELETE FROM assignment_submission_files WHERE submission_id = ?",
        [submissionId]
      );

      for (const file of files) {
        await pool.query(
          "INSERT INTO assignment_submission_files (submission_id, file_name, file_path, file_size, file_type) VALUES (?, ?, ?, ?, ?)",
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
        `SELECT ae.entity_id, ae.entity_name as title, ae.created_at, ae.course_id,
                MAX(CASE WHEN aa.attribute_name='description' THEN aea.value_string END) AS description,
                MAX(CASE WHEN aa.attribute_name IN ('dueDate', 'deadline') THEN aea.value_string END) AS dueDate,
                MAX(CASE WHEN aa.attribute_name IN ('totalMarks', 'marks') THEN aea.value_number END) AS totalMarks,
                ce.entity_name as course_name
         FROM assignment_entity ae
         LEFT JOIN assignment_entity_attribute aea ON aea.entity_id = ae.entity_id
         LEFT JOIN assignment_attributes aa ON aa.attribute_id = aea.attribute_id
         LEFT JOIN course_entity ce ON ce.entity_id = ae.course_id
         WHERE ae.entity_type = 'assignment'
         GROUP BY ae.entity_id
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
              course_name: assignment.course_name,
              title: assignment.title,
              description: assignment.description || '',
              dueDate: assignment.dueDate || '',
              deadline: assignment.dueDate || '',
              totalMarks: assignment.totalMarks || null,
              created_at: assignment.created_at,
              status: (submission && submission.length > 0) ? submission[0].status : 'pending',
              submission_status: (submission && submission.length > 0) ? 'submitted' : 'not_submitted'
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
        "SELECT * FROM assignment_submission_entity WHERE entity_id = ?",
        [submission_id]
      );

      if (!submission || submission.length === 0) {
        throw new Error("Submission not found");
      }

      const [files] = await pool.query(
        "SELECT * FROM assignment_submission_files WHERE submission_id = ? ORDER BY uploaded_at DESC",
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
        "SELECT * FROM assignment_submission_entity WHERE assignment_id = ? ORDER BY created_at DESC",
        [assignment_id]
      );

      const result = [];
      for (const submission of submissions || []) {
        const [files] = await pool.query(
          "SELECT * FROM assignment_submission_files WHERE submission_id = ?",
          [submission.entity_id]
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
