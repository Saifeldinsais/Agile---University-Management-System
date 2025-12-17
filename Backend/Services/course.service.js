const CourseEntity = require("../EAV models/course_entity");
const CourseAttribute = require("../EAV models/course_attribute");
const CourseValue = require("../EAV models/course_value");
const pool = require("../Db_config/DB");

let courseAttributesInitialized = false;

const initializeCourseAttributes = async () => {
  if (courseAttributesInitialized) return;

  const ensure = async (name, type) => {
    const existing = await CourseAttribute.getAttributeByName(name);
    if (!existing) await CourseAttribute.createCourseAttribute(name, type);
  };

  await ensure("title", "string");
  await ensure("code", "string");
  await ensure("description", "string");
  await ensure("credits", "decimal");
  await ensure("department", "string");

  courseAttributesInitialized = true;
};

const CourseService = {
  createCourse: async ({ title, code, description = "", credits, department }) => {
    try {
      await initializeCourseAttributes();

      if (!title || !code || credits == null || !department) {
        return { success: false, message: "title, code, credits, department are required" };
      }

      // unique code check (زي Mongo عندك) :contentReference[oaicite:0]{index=0}
      const existing = await CourseEntity.findByAttribute("code", String(code).toUpperCase());
      if (existing) {
        return { success: false, message: "Course with this code already exists" };
      }

      const courseId = await CourseEntity.createCourse("course", title);

      const titleAttr = await CourseAttribute.getAttributeByName("title");
      const codeAttr = await CourseAttribute.getAttributeByName("code");
      const descAttr = await CourseAttribute.getAttributeByName("description");
      const creditsAttr = await CourseAttribute.getAttributeByName("credits");
      const deptAttr = await CourseAttribute.getAttributeByName("department");

      await CourseValue.createCourseValue(courseId, titleAttr.attribute_id, { value_string: title });
      await CourseValue.createCourseValue(courseId, codeAttr.attribute_id, { value_string: String(code).toUpperCase() });
      await CourseValue.createCourseValue(courseId, descAttr.attribute_id, { value_string: description });
      await CourseValue.createCourseValue(courseId, creditsAttr.attribute_id, { value_number: Number(credits) });
      await CourseValue.createCourseValue(courseId, deptAttr.attribute_id, { value_string: department });

      return { success: true, id: courseId, message: "Course created successfully" };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // يرجّع كل الكورسات كـ object جاهز للـ frontend
  getAllCoursesDetailed: async () => {
    try {
      await initializeCourseAttributes();

      const [rows] = await pool.query(`
        SELECT
          ce.entity_id,
          MAX(CASE WHEN ca.attribute_name='title' THEN cea.value_string END) AS title,
          MAX(CASE WHEN ca.attribute_name='code' THEN cea.value_string END) AS code,
          MAX(CASE WHEN ca.attribute_name='description' THEN cea.value_string END) AS description,
          MAX(CASE WHEN ca.attribute_name='credits' THEN cea.value_number END) AS credits,
          MAX(CASE WHEN ca.attribute_name='department' THEN cea.value_string END) AS department
        FROM course_entity ce
        LEFT JOIN course_entity_attribute cea ON ce.entity_id = cea.entity_id
        LEFT JOIN course_attributes ca ON cea.attribute_id = ca.attribute_id
        GROUP BY ce.entity_id
        ORDER BY ce.entity_id DESC;
      `);

      return { success: true, courses: rows };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  updateCourse: async (id, data) => {
    try {
      await initializeCourseAttributes();

      const course = await CourseEntity.getCourseById(id);
      if (!course) return { success: false, message: "Course not found" };

      // لو title اتغير، حدّث entity_name كمان
      if (data.title) await CourseEntity.updateCourse(id, data.title);

      const upsert = async (attrName, value, isNumber = false) => {
        const attr = await CourseAttribute.getAttributeByName(attrName);
        const existing = await CourseValue.getCourseValue(id, attr.attribute_id);

        if (existing) {
          await CourseValue.updateCourseValue(existing.value_id, isNumber ? { value_number: value } : { value_string: value });
        } else {
          await CourseValue.createCourseValue(id, attr.attribute_id, isNumber ? { value_number: value } : { value_string: value });
        }
      };

      if (data.code != null) {
        // unique code check (except same course)
        const codeUpper = String(data.code).toUpperCase();
        const found = await CourseEntity.findByAttribute("code", codeUpper);
        if (found && Number(found.entity_id) !== Number(id)) {
          return { success: false, message: "Course with this code already exists" };
        }
        await upsert("code", codeUpper);
      }

      if (data.title != null) await upsert("title", data.title);
      if (data.description != null) await upsert("description", data.description);
      if (data.credits != null) await upsert("credits", Number(data.credits), true);
      if (data.department != null) await upsert("department", data.department);

      return { success: true, message: "Course updated successfully" };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  deleteCourse: async (id) => {
    try {
      await initializeCourseAttributes();

      const ok = await CourseEntity.deleteCourse(id); // FK cascade يشيل values
      if (!ok) return { success: false, message: "Course not found" };

      return { success: true, message: "Course deleted successfully" };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },
};

module.exports = CourseService;
