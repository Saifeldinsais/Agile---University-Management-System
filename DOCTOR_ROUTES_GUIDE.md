# Doctor Routes & Navigation Guide

## Route Structure

### Main Doctor Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/doctor` | DoctorDashboard | Main dashboard (default index) |
| `/doctor/dashboard` | DoctorDashboard | Enhanced dashboard with tabs |
| `/doctor/courses` | DoctorMyCourses | List all assigned courses |
| `/doctor/courses/:courseId` | DoctorCourseDetail | View/manage single course (upload assignments) |
| `/doctor/students` | DoctorStudents | View students in selected course |
| `/doctor/facilities` | DoctorFacilities | Browse university facilities |
| `/doctor/grades` | NotImplemented | Grade management (to be implemented) |

## Navigation Flow

### After Login
```
Doctor Login → /doctor/dashboard (NEW default)
                    ↓
            Enhanced Dashboard (4 tabs)
```

### Dashboard Tabs Navigation

```
📊 Overview Tab
    ├── Quick stats (courses, students, assignments)
    ├── Course overview cards
    └── Quick action buttons

📚 My Courses Tab
    ├── View all courses in grid
    ├── Course details
    └── [Manage Course] → /doctor/courses/:courseId

👥 Students Tab
    ├── Course dropdown selector
    ├── Search students
    └── Student table with enrollment info

📝 Assignments Tab
    ├── All assignments from all courses
    ├── Filter by course
    └── [View Course] → /doctor/courses/:courseId
```

### Navbar Navigation

```
UMS Logo → /doctor/dashboard

Dashboard → /doctor/dashboard
Courses → /doctor/courses
Students → /doctor/students
Facilities → /doctor/facilities

Logout Button → /login (clears localStorage)
```

## Complete User Journey

### 1. Login Flow
```
/login (doctor@ums-doctor.edu)
  ↓
  Login successful
  ↓
  Store: userId, user, token, email
  ↓
  Redirect → /doctor/dashboard ✨
```

### 2. Dashboard Overview
```
/doctor/dashboard (Overview Tab - Default)
  ├── Welcome greeting with stats
  ├── [View All Courses] → Tab switch to Courses
  ├── [Browse Students] → Tab switch to Students
  ├── [Manage Assignments] → Tab switch to Assignments
  └── [Facilities] → /doctor/facilities
```

### 3. Course Management
```
/doctor/dashboard (Courses Tab)
  ├── All courses displayed in grid
  ├── Click course card
  └── [Manage Course] → /doctor/courses/{courseId}
      ├── View course details
      ├── [Create Assignment]
      ├── [Edit Assignment]
      ├── [Upload Assignment File]
      └── Back to Dashboard
```

### 4. Student Management
```
/doctor/dashboard (Students Tab)
  ├── Select Course: [Dropdown]
  ├── Search Students: [Input field]
  └── View Student Table
      ├── Name
      ├── Email
      ├── Student Code
      └── Status (Active)
```

### 5. Assignments Overview
```
/doctor/dashboard (Assignments Tab)
  ├── All assignments from all courses
  ├── Each assignment shows:
  │   ├── Title
  │   ├── Course name badge
  │   ├── Due date
  │   ├── Total marks
  │   └── [View Course] → /doctor/courses/{courseId}
```

### 6. Facilities
```
/doctor/facilities
  ├── Filter by category buttons
  ├── Facility cards with:
  │   ├── Icon
  │   ├── Name & category badge
  │   ├── Description
  │   ├── Location
  │   ├── Hours
  │   ├── Contact
  │   └── [Learn More] button
```

### 7. Logout
```
Navbar [Logout] Button
  ↓
  Clear all localStorage data
  ↓
  Redirect → /login
```

## Key Features by Route

### DoctorDashboard (/doctor/dashboard) ✨
- **4 Tabs**:
  1. Overview - Statistics & quick actions
  2. My Courses - Course management grid
  3. Students - Student search & view
  4. Assignments - All assignments overview
- **Real-time data** fetching from API
- **Responsive design** for all devices
- **Error handling** with retry buttons
- **Loading states** for better UX

### DoctorFacilities (/doctor/facilities) ✨
- **8 Categories** of facilities
- **Filter by category** with active state
- **Facility cards** with detailed information
- **Mock data** for 10 university facilities
- **Professional styling** with hover effects

### DoctorCourseDetail (/doctor/courses/:courseId)
- View course details
- **Create assignments**
- **Edit assignments**
- **Upload assignment files** to students
- View course metadata

### DoctorStudents (/doctor/students)
- Select specific course
- Search students by name/email/code
- View enrolled students table
- Display student status

## Data Flow

```
Login Credentials
  ↓
/api/auth/login
  ↓
Store: userId, user, token, email
  ↓
Redirect to /doctor/dashboard
  ↓
fetchOverviewData()
  ├── GET /api/doctor/courses/{doctorId}
  ├── GET /api/doctor/courses/{courseId}/students
  └── GET /api/doctor/courses/{courseId}/assignments
  ↓
Display Dashboard with stats
```

## Environment & Configuration

- **Backend API**: `http://localhost:5000`
- **Frontend Port**: Vite dev server (typically 5173)
- **Storage**: localStorage for user session
- **Auth Token**: Stored in localStorage['token']

## Error Handling

All pages include error state management:
- Network error messages
- "No data" empty states
- Retry buttons for failed requests
- Form validation feedback
- Loading skeletons while fetching

## Performance Optimizations

- **Tab-based lazy loading**: Data only fetches when tab is active
- **Memoized computations**: useMemo for filtered/calculated data
- **Efficient re-renders**: useEffect dependencies properly configured
- **Responsive images**: CSS Grid/Flexbox layouts
- **CSS Modules**: Scoped styling to prevent conflicts

---

**All doctor functionality is now organized in a modern, tabbed interface with proper navigation and redirect on login!**
