# Course Creation - Quick Fix Guide

## ✅ Problem Solved!

The 400 Bad Request error was caused by missing course attributes in the database.

### What Was Missing

The `admin.service.js` expects these attributes:
- `code` (not `course_code`)
- `title` (not `course_name`)
- `description`
- `credits`
- `department`

### What We Did

✅ Added the missing attributes to `course_attributes` table

### Current Attributes

Your `course_attributes` table now has **12 attributes**:

**Required by Admin Service:**
1. ✅ `code` - Course code (e.g., "CSE233")
2. ✅ `title` - Course title
3. ✅ `description` - Course description
4. ✅ `credits` - Number of credits
5. ✅ `department` - Department name

**Additional Attributes:**
6. `course_code` - Alternative code field
7. `course_name` - Alternative name field
8. `instructor_id` - Teacher assignment
9. `semester` - Semester info
10. `year` - Academic year
11. `max_students` - Max enrollment
12. `enrolled_count` - Current enrollment

---

## 🎯 Try Creating a Course Now!

The POST request to `/api/admin/courses` should now work with this format:

```json
{
  "title": "Data Structures",
  "code": "CSE202",
  "description": "Introduction to data structures and algorithms",
  "credits": 3,
  "department": "Computer Science"
}
```

---

## ✨ What Happens When You Create a Course

1. Creates entry in `course_entity` table
2. Stores each field as a separate row in `course_entity_attribute`
3. Returns the course data with ID

---

**Try it now from your Admin Curriculum page!** 🚀
