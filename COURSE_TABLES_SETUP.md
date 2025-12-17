# Course EAV Tables - Setup Complete! 📚

## ✅ Created Tables

### 1. `course_entity`
Stores course entities (the main course records)

**Columns:**
- `entity_id` INT (Primary Key, Auto Increment)
- `entity_type` VARCHAR(50) - Default: 'course'
- `entity_name` VARCHAR(255) - Course name
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

---

### 2. `course_attributes`
Defines what attributes a course can have

**Columns:**
- `attribute_id` INT (Primary Key, Auto Increment)
- `attribute_name` VARCHAR(100) - Unique attribute name
- `data_type` ENUM('string', 'int', 'float', 'datetime', 'text', 'boolean')
- `created_at` TIMESTAMP

**Pre-loaded Attributes:**
1. `course_code` (string) - e.g., "CSE233"
2. `course_name` (string) - e.g., "Agile Software Engineering"
3. `description` (text) - Course description
4. `credits` (int) - Number of credits
5. `department` (string) - Department name
6. `instructor_id` (int) - Reference to teacher entity
7. `semester` (string) - e.g., "Fall", "Spring"
8. `year` (int) - Academic year
9. `max_students` (int) - Maximum enrollment
10. `enrolled_count` (int) - Current enrollment count

---

### 3. `course_entity_attribute`
Stores the actual attribute values for each course

**Columns:**
- `value_id` INT (Primary Key, Auto Increment)
- `entity_id` INT (Foreign Key → course_entity)
- `attribute_id` INT (Foreign Key → course_attributes)
- `value_string` VARCHAR(500) - For string/text values
- `value_number` DECIMAL(20,4) - For numeric values
- `value_reference` INT - For foreign key references
- `array_index` INT - For array-type attributes
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

**Constraints:**
- Unique constraint on (entity_id, attribute_id) - One value per attribute per course
- CASCADE DELETE - Deleting a course deletes all its attributes

---

## 📝 How to Use These Tables

### Creating a Course

```javascript
const CourseEntity = require('./EAV models/course_entity');
const CourseAttribute = require('./EAV models/course_attribute');

// 1. Create the course entity
const courseId = await CourseEntity.createCourse('course', 'Data Structures');

// 2. Get attribute IDs
const codeAttr = await CourseAttribute.getAttributeByName('course_code');
const creditsAttr = await CourseAttribute.getAttributeByName('credits');

// 3. Set attribute values
await pool.query(
  'INSERT INTO course_entity_attribute (entity_id, attribute_id, value_string) VALUES (?, ?, ?)',
  [courseId, codeAttr.attribute_id, 'CSE202']
);

await pool.query(
  'INSERT INTO course_entity_attribute (entity_id, attribute_id, value_number) VALUES (?, ?, ?)',
  [courseId, creditsAttr.attribute_id, 3]
);
```

### Querying a Course with All Attributes

```sql
SELECT 
  ce.entity_id,
  ce.entity_name,
  ca.attribute_name,
  COALESCE(cea.value_string, CAST(cea.value_number AS CHAR)) AS value
FROM course_entity ce
LEFT JOIN course_entity_attribute cea ON ce.entity_id = cea.entity_id
LEFT JOIN course_attributes ca ON cea.attribute_id = ca.attribute_id
WHERE ce.entity_id = 1;
```

---

## 🚀 Quick Start Scripts

### Create Tables
```bash
node Scripts/setup-course-tables.js
```

### Create Sample Courses (coming soon)
You can now update your `create-sample-courses.js` script to use these new tables!

---

## 🔄 Migration from Old System

If you have courses in the old `entities` table, you'll need to migrate them to `course_entity`. 

**Would you like me to create a migration script?**

---

## 📊 Current Database Structure

```
university_management/
├── User Tables (Global EAV)
│   ├── entities
│   ├── attributes  
│   └── entity_attribute
│
└── Course Tables (Course-specific EAV)
    ├── course_entity
    ├── course_attributes
    └── course_entity_attribute
```

---

## ✅ Next Steps

1. ✅ **Tables Created** - All course EAV tables are ready
2. ⏭️ **Populate Courses** - Add courses using the course models
3. ⏭️ **Update API Endpoints** - Make sure controllers use course_entity tables
4. ⏭️ **Create Enrollment System** - Link students to courses
5. ⏭️ **Build Course Management UI** - Admin/Doctor dashboards

---

**Your course EAV system is ready to use!** 🎉

All models in `Backend/EAV models/course_*.js` will now work correctly with these tables.
