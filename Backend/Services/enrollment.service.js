const EnrollmentEntity = require("../EAV models/enrollment_entity");
const EnrollmentAttribute = require("../EAV models/enrollment_attribute");
const EnrollmentValue = require("../EAV models/enrollment_value");
const pool = require("../Db_config/DB");

let enrAttrsInit = false;
const initEnrollmentAttrs = async () => {
  if (enrAttrsInit) return;

  const ensure = async (name, type) => {
    const a = await EnrollmentAttribute.getAttributeByName(name);
    if (!a) await EnrollmentAttribute.createEnrollmentAttribute(name, type);
  };

  await ensure("studentId", "reference");
  await ensure("courseId", "reference");
  await ensure("status", "string");
  await ensure("grade", "decimal");

  enrAttrsInit = true;
};

const EnrollmentService = {
  // create enrollment
  createEnrollment: async ({ studentId, courseId, status = "pending" }) => {
    await initEnrollmentAttrs();

    // منع duplicate enrollment: نفس student + course
    const studentAttr = await EnrollmentAttribute.getAttributeByName("studentId");
    const courseAttr = await EnrollmentAttribute.getAttributeByName("courseId");

    // find existing by joining values (EAV)
    const [exists] = await pool.query(
      `SELECT ee.entity_id
       FROM enrollment_entity ee
       JOIN enrollment_entity_attribute v1 ON v1.entity_id = ee.entity_id AND v1.attribute_id = ? AND v1.value_reference = ?
       JOIN enrollment_entity_attribute v2 ON v2.entity_id = ee.entity_id AND v2.attribute_id = ? AND v2.value_reference = ?
       LIMIT 1`,
      [studentAttr.attribute_id, studentId, courseAttr.attribute_id, courseId]
    );
    if (exists.length) return { success: false, message: "Student already enrolled in this course" };

    const entityName = `enrollment-${studentId}-${courseId}`;
    const enrId = await EnrollmentEntity.createEnrollment("enrollment", entityName);

    const statusAttr = await EnrollmentAttribute.getAttributeByName("status");
    const gradeAttr = await EnrollmentAttribute.getAttributeByName("grade");

    await EnrollmentValue.createEnrollmentValue(enrId, studentAttr.attribute_id, { value_reference: Number(studentId) });
    await EnrollmentValue.createEnrollmentValue(enrId, courseAttr.attribute_id, { value_reference: Number(courseId) });
    await EnrollmentValue.createEnrollmentValue(enrId, statusAttr.attribute_id, { value_string: status });
    await EnrollmentValue.createEnrollmentValue(enrId, gradeAttr.attribute_id, { value_number: null });

    return { success: true, id: enrId };
  },

  // update status for all pending enrollments of student (accept/reject)
  updateStudentPendingStatus: async (studentId, newStatus) => {
    await initEnrollmentAttrs();

    const studentAttr = await EnrollmentAttribute.getAttributeByName("studentId");
    const statusAttr = await EnrollmentAttribute.getAttributeByName("status");

    // get enrollments for student
    const [enrs] = await pool.query(
      `SELECT ee.entity_id
       FROM enrollment_entity ee
       JOIN enrollment_entity_attribute v ON v.entity_id = ee.entity_id
       WHERE v.attribute_id = ? AND v.value_reference = ?`,
      [studentAttr.attribute_id, studentId]
    );

    let updated = 0;
    for (const row of enrs) {
      const enrId = row.entity_id;

      const statusVal = await EnrollmentValue.getEnrollmentValue(enrId, statusAttr.attribute_id);
      if (statusVal && statusVal.value_string === "pending") {
        await EnrollmentValue.updateEnrollmentValue(statusVal.value_id, { value_string: newStatus });
        updated++;
      }
    }

    return { success: updated > 0, updated };
  },
};

module.exports = EnrollmentService;
