# Enrollment EAV Tables - Setup Complete! 📝

## ✅ Created Tables

### 1. `enrollment_entity`
Stores enrollment records (student-course relationships)

**Columns:**
- `entity_id` INT (Primary Key, Auto Increment)
- `entity_type` VARCHAR(50) - Default: 'enrollment'
- `entity_name` VARCHAR(255) - Enrollment identifier
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

---

### 2. `enrollment_attributes`
Defines what attributes an enrollment can have

**Columns:**
- `attribute_id` INT (Primary Key, Auto Increment)
- `attribute_name` VARCHAR(100) - Unique attribute name
- `data_type` ENUM('string', 'int', 'float', 'datetime', 'text', 'boolean')
- `created_at` TIMESTAMP

**Pre-loaded Attributes:**
1. `student_id` (int) - Student entity ID
2. `course_id` (int) - Course entity ID
3. `status` (string) - e.g., "pending", "accepted", "completed", "dropped"
4. `grade` (float) - Final grade (0-100 or GPA)
5. `enrollment_date` (datetime) - When student enrolled
6. `completion_date` (datetime) - When course was completed
7. `semester` (string) - e.g., "Fall 2024", "Spring 2025"
8. `year` (int) - Academic year

---

### 3. `enrollment_entity_attribute`
Stores the actual attribute values for each enrollment

**Columns:**
- `value_id` INT (Primary Key, Auto Increment)
- `entity_id` INT (Foreign Key → enrollment_entity)
- `attribute_id` INT (Foreign Key → enrollment_attributes)
- `value_string` VARCHAR(500) - For string/text values
- `value_number` DECIMAL(20,4) - For numeric values
- `value_reference` INT - For foreign key references
- `array_index` INT - For array-type attributes
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

**Constraints:**
- Unique constraint on (entity_id, attribute_id)
- CASCADE DELETE - Deleting an enrollment deletes all its attributes

---

## 📝 How to Use Enrollment Tables

### Creating an Enrollment

```javascript
const EnrollmentEntity = require('./EAV models/enrollment_entity');
const EnrollmentAttribute = require('./EAV models/enrollment_attribute');
const pool = require('./Db_config/DB');

// 1. Create the enrollment entity
const enrollmentId = await EnrollmentEntity.createEnrollment(
  'enrollment', 
  'Student_123_Course_CSE233'
);

// 2. Get attribute IDs
const studentIdAttr = await EnrollmentAttribute.getAttributeByName('student_id');
const courseIdAttr = await EnrollmentAttribute.getAttributeByName('course_id');
const statusAttr = await EnrollmentAttribute.getAttributeByName('status');

// 3. Set attribute values
await pool.query(
  'INSERT INTO enrollment_entity_attribute (entity_id, attribute_id, value_number) VALUES (?, ?, ?)',
  [enrollmentId, studentIdAttr.attribute_id, 123] // student ID
);

await pool.query(
  'INSERT INTO enrollment_entity_attribute (entity_id, attribute_id, value_number) VALUES (?, ?, ?)',
  [enrollmentId, courseIdAttr.attribute_id, 5] // course ID
);

await pool.query(
  'INSERT INTO enrollment_entity_attribute (entity_id, attribute_id, value_string) VALUES (?, ?, ?)',
  [enrollmentId, statusAttr.attribute_id, 'pending']
);
```

### Querying Enrollments for a Student

```sql
SELECT 
  ee.entity_id,
  MAX(CASE WHEN ea.attribute_name='student_id' THEN eea.value_number END) AS student_id,
  MAX(CASE WHEN ea.attribute_name='course_id' THEN eea.value_number END) AS course_id,
  MAX(CASE WHEN ea.attribute_name='status' THEN eea.value_string END) AS status,
  MAX(CASE WHEN ea.attribute_name='grade' THEN eea.value_number END) AS grade
FROM enrollment_entity ee
LEFT JOIN enrollment_entity_attribute eea ON ee.entity_id = eea.entity_id
LEFT JOIN enrollment_attributes ea ON eea.attribute_id = ea.attribute_id
GROUP BY ee.entity_id
HAVING student_id = 123;
```

### Enrollment Status Values

Recommended status values:
- `pending` - Enrollment requested, awaiting approval
- `accepted` - Enrollment approved
- `active` - Currently enrolled
- `completed` - Course finished
- `dropped` - Student dropped the course
- `failed` - Failed the course
- `withdrawn` - Administratively withdrawn

---

## 🔄 Integration with Existing System

### Student Enrollment Flow

1. **Student enrolls** → `POST /api/student/enroll`
2. **Create enrollment entity** with status "pending"
3. **Admin reviews** → Can accept/reject
4. **Status updates** → "accepted", "active", etc.
5. **Doctor assigns grade** → Update grade attribute
6. **Completion** → Status changes to "completed"

---

## 📊 Current Database Structure

```
university_management/
├── User System (Global EAV)
│   ├── entities
│   ├── attributes
│   └── entity_attribute
│
├── Course System (Course-specific EAV)
│   ├── course_entity
│   ├── course_attributes
│   └── course_entity_attribute
│
└── Enrollment System (Enrollment-specific EAV) ✅ NEW
    ├── enrollment_entity
    ├── enrollment_attributes
    └── enrollment_entity_attribute
```

---

## 🚀 Quick Start Commands

### Create Tables
```bash
node Scripts/setup-enrollment-tables.js
```

### Test Enrollment Creation (Sample)
```bash
# Create this script if needed
node Scripts/create-sample-enrollments.js
```

---

## ✨ Next Steps

1. ✅ **Tables Created** - All enrollment EAV tables ready
2. ⏭️ **Implement Enroll API** - Let students enroll in courses
3. ⏭️ **Admin Approval System** - Accept/reject enrollments
4. ⏭️ **Grade Management** - Doctors can assign grades
5. ⏭️ **Student Dashboard** - Show enrolled courses
6. ⏭️ **Completion Tracking** - Mark courses as completed

---

**Your enrollment EAV system is ready to use!** 🎉

All models in `Backend/EAV models/enrollment_*.js` will now work correctly with these tables.
