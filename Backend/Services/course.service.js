const Entity = require("../EAV models/Entity");
const Attribute = require("../EAV models/Attribute");
const Value = require("../EAV models/Value");

// make sure course attributes exist once
async function ensureCourseAttributes() {
  const attrs = [
    ["code", "string"],
    ["title", "string"],
    ["description", "string"],
    ["credits", "int"],
    ["department", "string"],
  ];

  for (const [name, type] of attrs) {
    const exists = await Attribute.getAttributeByName(name);
    if (!exists) {
      await Attribute.create(name, type);
    }
  }
}

// helper to insert/update value
async function upsert(entityId, attrName, val) {
  const attr = await Attribute.getAttributeByName(attrName);
  const existing = await Value.getValue(entityId, attr.attribute_id);

  const data =
    typeof val === "number"
      ? { value_number: val }
      : { value_string: val };

  if (existing) {
    return Value.updateValue(existing.value_id, data);
  }
  return Value.createValue(entityId, attr.attribute_id, data);
}

const courseService = {
  // CREATE
  create: async ({ code, title, description, credits, department }) => {
    await ensureCourseAttributes();

    // unique course code
    const exists = await Entity.findByAttribute("code", code);
    if (exists) {
      return { success: false, message: "Course code already exists" };
    }

    const courseId = await Entity.create("course", title);

    await upsert(courseId, "code", code);
    await upsert(courseId, "title", title);
    await upsert(courseId, "description", description || "");
    await upsert(courseId, "credits", credits);
    await upsert(courseId, "department", department);

    return { success: true, id: courseId };
  },

  // READ
  getAll: async () => {
    const courses = await Entity.findByType("course");

    const codeAttr = await Attribute.getAttributeByName("code");
    const titleAttr = await Attribute.getAttributeByName("title");
    const creditsAttr = await Attribute.getAttributeByName("credits");
    const deptAttr = await Attribute.getAttributeByName("department");

    const result = [];

    for (const c of courses) {
      result.push({
        id: c.entity_id,
        code: (await Value.getValue(c.entity_id, codeAttr.attribute_id))?.value_string,
        title: (await Value.getValue(c.entity_id, titleAttr.attribute_id))?.value_string,
        credits: (await Value.getValue(c.entity_id, creditsAttr.attribute_id))?.value_number,
        department: (await Value.getValue(c.entity_id, deptAttr.attribute_id))?.value_string,
      });
    }

    return result;
  },

  // UPDATE
  update: async (id, data) => {
    await ensureCourseAttributes();

    if (data.code) await upsert(id, "code", data.code);
    if (data.title) await upsert(id, "title", data.title);
    if (data.description) await upsert(id, "description", data.description);
    if (data.credits) await upsert(id, "credits", data.credits);
    if (data.department) await upsert(id, "department", data.department);

    return true;
  },
  delete: async (id) => {
    const Entity = require("../EAV models/Entity");
    const ok = await Entity.delete(id);
    return ok;
  },

};

module.exports = courseService;
