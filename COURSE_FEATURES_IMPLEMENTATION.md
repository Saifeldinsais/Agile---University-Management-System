# Doctor Portal - Course Management Features Implementation

## Overview
Successfully implemented three major course management functionalities for the doctor portal:
1. **Course Resources & Content Management**
2. **Teaching Assistants (TAs) Display**
3. **Course Schedule Display**

---

## 1. Database Implementation

### Tables Created

#### `course_resources`
```sql
CREATE TABLE course_resources (
    resource_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT,
    doctor_id INT,
    title VARCHAR(255),          -- Resource title (Lecture Slides, Lab Instructions, etc.)
    description TEXT,             -- Optional short description
    file_name VARCHAR(255),       -- Original filename
    file_path VARCHAR(500),       -- URL/path to access the file
    file_type VARCHAR(50),        -- 'pdf', 'doc', 'image', 'video', etc.
    file_size INT,                -- File size in bytes
    upload_date TIMESTAMP,        -- When it was uploaded
    is_active BOOLEAN DEFAULT TRUE
);
```

#### `course_staff`
```sql
CREATE TABLE course_staff (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT,
    staff_id INT,
    doctor_id INT,
    role VARCHAR(50),             -- 'teaching_assistant', 'lab_instructor', etc.
    assigned_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE KEY (course_id, staff_id)
);
```

#### `course_schedule`
```sql
CREATE TABLE course_schedule (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT,
    doctor_id INT,
    day_of_week VARCHAR(20),      -- 'Monday', 'Tuesday', etc.
    start_time TIME,              -- '10:00:00'
    end_time TIME,                -- '11:30:00'
    classroom_id INT,             -- Optional reference
    room_name VARCHAR(100),       -- 'Room 101', 'Lab A'
    semester VARCHAR(20),         -- 'Spring 2024'
    is_active BOOLEAN DEFAULT TRUE
);
```

---

## 2. Backend Implementation

### New API Endpoints

#### Course Resources
- **GET** `/api/doctor/courses/:courseId/resources`
  - Returns all resources for a course
  - Response: Array of resource objects with title, description, file info

- **POST** `/api/doctor/courses/:courseId/resources/upload`
  - Upload a new course resource
  - Accepts: multipart/form-data with file, title, description, doctorId
  - Supported file types: PDF, DOC, DOCX, PPT, PPTX, images, CSV, Excel, video

#### Course Staff (TAs)
- **GET** `/api/doctor/courses/:courseId/staff`
  - Returns all TAs assigned to a course
  - Response: Array of staff objects with name, role, email

#### Course Schedule
- **GET** `/api/doctor/courses/:courseId/schedule/:doctorId`
  - Returns all scheduled time slots for a course
  - Response: Array of schedule objects with day, time, room

### New Controller Methods (`doctor.controller.js`)

```javascript
// Course Resources
- getCourseResources(courseId)
- uploadCourseResource(courseId, doctorId, resourceData)

// Course Staff
- getCourseStaff(courseId)

// Course Schedule
- getCourseSchedule(courseId, doctorId)
```

### New Service Methods (`doctor.service.js`)

```javascript
// Retrieves resources for a course from database
getCourseResources(courseId)

// Inserts new resource and returns created object
uploadCourseResource(courseId, doctorId, resourceData)

// Joins course_staff with users table to get staff details
getCourseStaff(courseId)

// Retrieves and sorts schedule by day and time
getCourseSchedule(courseId, doctorId)
```

### New Utilities
- **`Utils/uploadResources.js`** - Multer configuration for resource uploads
  - Max file size: 50MB (supports videos)
  - Allowed types: PDF, Office docs, images, spreadsheets, videos
  - Upload directory: `/uploads/resources/`

### New Routes (`doctor.routes.js`)
```javascript
router.get("/courses/:courseId/resources", getCourseResources);
router.post("/courses/:courseId/resources/upload", uploadResource.single("file"), uploadCourseResource);
router.get("/courses/:courseId/staff", getCourseStaff);
router.get("/courses/:courseId/schedule/:doctorId", getCourseSchedule);
```

---

## 3. Frontend Implementation

### Updated Component: `Courses.jsx`

#### New State Variables
```javascript
const [courseResources, setCourseResources] = useState([]);
const [courseStaff, setCourseStaff] = useState([]);
const [courseSchedule, setCourseSchedule] = useState([]);
const [showUploadModal, setShowUploadModal] = useState(false);
const [uploadTitle, setUploadTitle] = useState("");
const [uploadDescription, setUploadDescription] = useState("");
const [uploadFile, setUploadFile] = useState(null);
```

#### New Features

##### 1. Course Resources Section
- **Display Resources:**
  - Shows title and description for each resource
  - File type badge (PDF, DOC, etc.)
  - File size display
  - Download button (↓) to access file

- **Upload Resources:**
  - Modal form with:
    - Resource Title (required)
    - Description (optional)
    - File selection (PDF, images, videos, docs, etc.)
  - Form validation
  - Loading state while uploading
  - Real-time list update after upload

##### 2. Teaching Assistants Section
- **Display TAs:**
  - Shows each TA's name
  - Role (Teaching Assistant, Lab Instructor, etc.)
  - Email address
  - Empty state message if no TAs assigned

##### 3. Course Schedule Section
- **Display Schedule:**
  - Day of week
  - Start and end time (formatted as 12-hour AM/PM)
  - Room/location
  - Sorted by day and time
  - Empty state message if no schedule assigned

#### API Integration in `handleViewDetails()`
```javascript
// Load course students
await axios.get(`/api/doctor/courses/${courseId}/students`)

// Load course resources
await axios.get(`/api/doctor/courses/${courseId}/resources`)

// Load course staff
await axios.get(`/api/doctor/courses/${courseId}/staff`)

// Load course schedule
await axios.get(`/api/doctor/courses/${courseId}/schedule/${doctorId}`)
```

#### Upload Handler
```javascript
handleUploadResource(e)
  - Validates title and file
  - Creates FormData with multipart
  - POSTs to `/api/doctor/courses/:courseId/resources/upload`
  - Updates UI with new resource
  - Resets form after success
```

#### Utility Function
```javascript
formatTime(time)
  - Converts 24-hour time to 12-hour AM/PM format
  - Example: "10:00:00" → "10:00 AM"
```

### Updated Styles: `Courses.module.css`

#### New CSS Classes

**Resource Enhancements:**
- `.resourceDesc` - Description text styling
- `.resourceMeta` - Metadata container (file type, size)
- `.fileType` - Badge for file type
- `.fileSize` - File size display
- `.downloadBtn` - Download button styling

**TA Items:**
- `.taItem` - Container for TA info
- `.taName` - TA name styling
- `.taRole` - Role badge styling
- `.taEmail` - Email display

**Modal:**
- `.modal` - Full-screen overlay
- `.modalContent` - Modal dialog box
- `.closeBtn` - Close button
- `.formGroup` - Form input grouping
- `.modalActions` - Form button container
- `.cancelBtn` / `.submitBtn` - Button styling

**Responsive:**
- Mobile optimizations for all new elements
- Modal max-width 90% on mobile
- Form inputs full-width

---

## 4. File Structure

### Backend Files Modified/Created
```
Backend/
├── Scripts/
│   └── setup-course-resources-staff.sql       [NEW] Database tables
├── Controllers/
│   └── doctor.controller.js                   [MODIFIED] +4 new methods
├── Services/
│   └── doctor.service.js                      [MODIFIED] +3 new methods
├── Routes/
│   └── doctor.routes.js                       [MODIFIED] +4 new routes
├── Utils/
│   └── uploadResources.js                     [NEW] File upload config
├── run-course-migration.js                    [NEW] Database setup script
└── verify-tables.js                           [NEW] Verification script
```

### Frontend Files Modified/Created
```
frontend/src/pages/doctor/
├── Courses.jsx                                [MODIFIED] Full feature implementation
└── Courses.module.css                         [MODIFIED] +200 lines of styling
```

---

## 5. How to Use

### For Admins (Backend Setup)
1. Ensure `.env` file has database credentials
2. Run migration: `node run-course-migration.js`
3. Verify tables: `node verify-tables.js`
4. Insert test data via admin panel (Course Assignments section)

### For Doctors (Frontend)
1. Navigate to Courses tab
2. Click "View Details" on any course
3. **Upload Resources:**
   - Click "+ Upload Resource"
   - Fill title and optional description
   - Select PDF/image/video file
   - Click "Upload"
4. **View TAs:**
   - Scroll to "Assigned Teaching Assistants"
   - See list of assigned staff (populated by admin)
5. **View Schedule:**
   - Scroll to "Course Schedule"
   - See all assigned time slots (populated by admin)

---

## 6. Data Flow

### Resource Upload Flow
```
Doctor clicks "Upload"
    ↓
Modal form opens (Courses.jsx)
    ↓
Doctor fills title + description + selects file
    ↓
POST to /api/doctor/courses/:courseId/resources/upload
    ↓
uploadResource middleware (multer) saves file
    ↓
doctor.controller.uploadCourseResource() called
    ↓
doctor.service.uploadCourseResource() inserts to DB
    ↓
Returns created resource object
    ↓
Frontend adds to courseResources state
    ↓
UI updates in real-time
```

### Resource Fetch Flow
```
Doctor clicks "View Details"
    ↓
handleViewDetails(course) executes
    ↓
GET /api/doctor/courses/:courseId/resources
    ↓
doctor.controller.getCourseResources() called
    ↓
doctor.service.getCourseResources() queries DB
    ↓
Returns array of active resources
    ↓
Frontend stores in courseResources state
    ↓
Maps to JSX elements with download links
```

### Staff & Schedule Flow
```
Similar fetch-on-view pattern
    ↓
GET /api/doctor/courses/:courseId/staff
GET /api/doctor/courses/:courseId/schedule/:doctorId
    ↓
Data populated from course_staff and course_schedule tables
    ↓
Displayed in UI with formatting
```

---

## 7. Key Features

### ✅ Course Resources
- Upload PDFs, documents, images, videos
- Add titles and descriptions
- View file type and size
- Download/access files
- Real-time upload confirmation

### ✅ Teaching Assistants
- View all assigned TAs
- See role and contact info
- Update happens when admin assigns staff
- Empty state handling

### ✅ Course Schedule
- Display class times by day
- Formatted 12-hour time display
- Room/location info
- Sorted by day and time
- Empty state handling

---

## 8. Admin Integration Points

### How Admins Populate Data

**Course Resources:** Done by doctors via upload button
**Course Staff:** Admins assign via "Course Assignments" page
**Course Schedule:** Admins assign via classroom booking system

All three features are read-only from doctor perspective, populated by system admins.

---

## 9. Testing Checklist

- [ ] Database tables created successfully
- [ ] Doctor can upload course resources
- [ ] Resources display with correct metadata
- [ ] Can download uploaded resources
- [ ] TAs display when assigned (via admin)
- [ ] Schedule displays when assigned (via admin)
- [ ] Times format correctly (12-hour)
- [ ] Mobile responsive layout works
- [ ] Empty states display when no data
- [ ] Modal form validation works
- [ ] File type restrictions enforced

---

## 10. Next Steps / Future Enhancements

1. **Admin Course Management:**
   - Interface to assign TAs to courses
   - Interface to assign schedule slots
   - Interface to manage resources (delete, edit)

2. **Advanced Features:**
   - Course material preview
   - File search/filter
   - Schedule conflict detection
   - TA availability management
   - Resource version control

3. **Integration:**
   - Sync with university calendar systems
   - Automated email notifications
   - Student access to resources
   - Real-time notifications for new materials

---

**Implementation Date:** December 24, 2025
**Status:** ✅ Complete and Ready for Testing
