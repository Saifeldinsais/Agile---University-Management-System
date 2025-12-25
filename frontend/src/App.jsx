// src/App.jsx
import { Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import StudentLayout from "./layouts/StudentLayout";
import DoctorLayout from "./layouts/DoctorLayout";
import DoctorMainLayout from "./layouts/DoctorMainLayout";

import NotImplemented from "./pages/NotImplemented";

import Home from "./pages/Home";
// import Facilities from "./pages/Facilities";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Signup from "./pages/Signup";

import AdminDashboard from "./pages/admin/dashboard";
import AdminFacilities from "./pages/admin/AdminFacilities";
import AdminEnrollments from "./pages/admin/AdminEnrollments";
import AdminStaffDirectory from "./pages/admin/AdminStaffDirectory";
import CourseAssignments from "./pages/admin/CourseAssignments";


import StudentDashboard from "./pages/student/Dashboard";
import StudentHome from "./pages/student/Home";
import StudentCourses from "./pages/student/Courses";
import StudentAssessments from "./pages/student/Assessments";
import StudentAnnouncements from "./pages/student/Announcements";

import DoctorDashboard from "./pages/doctor/DoctorDashboard";

// New Doctor Pages
import DoctorCourses from "./pages/doctor/Courses";
import DoctorAssessments from "./pages/doctor/Assessments";
import DoctorGrading from "./pages/doctor/Grading";
import DoctorStudents from "./pages/doctor/Students";
import DoctorCommunication from "./pages/doctor/Communication";
import DoctorOfficeHours from "./pages/doctor/OfficeHours";
import DoctorAnnouncements from "./pages/doctor/Announcements";
import DoctorProfile from "./pages/doctor/Profile";
import DoctorAdvisor from "./pages/doctor/Advisor";

import AdminCurriculum from "./pages/admin/AdminCurriculum";

import TADashboard from "./pages/ta/TADashboard";

import AdvisorDashboard from "./pages/advisor/AdvisorDashboard";


function App() {
  return (
    <Routes>
      {/* USER PAGES with Main layout + navbar */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/facilities" element={<NotImplemented />} />
        <Route path="/dashboard" element={<NotImplemented />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      {/* ADMIN PAGES (no navbar, full admin layout) */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/facilities" element={<AdminFacilities />} />
      <Route path="/admin/curriculum" element={<AdminCurriculum />} />
      <Route path="/admin/enrollments" element={<AdminEnrollments />} />
      <Route path="/admin/staff/directory" element={<AdminStaffDirectory />} />
      <Route path="/admin/staff/assignments" element={<CourseAssignments />} />


      {/* Student PAGES */}
      <Route path="student" element={<StudentLayout />} >
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="courses" element={<StudentCourses />} />
        <Route path="assessments" element={<StudentAssessments />} />
        <Route path="announcements" element={<StudentAnnouncements />} />
        <Route path="facilities" element={<NotImplemented />} />
        <Route path="staff-communication" element={<NotImplemented />} />
        <Route path="office-hours" element={<NotImplemented />} />
        <Route path="profile" element={<NotImplemented />} />
        <Route index element={<StudentDashboard />} />
      </Route>

      {/* Doctor/Teacher PAGES - NEW MAIN LAYOUT */}
      <Route path="doctor" element={<DoctorMainLayout />}>
        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="courses" element={<DoctorCourses />} />
        <Route path="assessments" element={<DoctorAssessments />} />
        <Route path="grading" element={<DoctorGrading />} />
        <Route path="students" element={<DoctorStudents />} />
        <Route path="communication" element={<DoctorCommunication />} />
        <Route path="office-hours" element={<DoctorOfficeHours />} />
        <Route path="announcements" element={<DoctorAnnouncements />} />
        <Route path="advisor" element={<DoctorAdvisor />} />
        <Route path="profile" element={<DoctorProfile />} />
        <Route index element={<DoctorDashboard />} />
      </Route>

      {/* TA (Teaching Assistant) PAGES */}
      <Route path="/ta/dashboard" element={<TADashboard />} />

      {/* Advisor PAGES */}
      <Route path="/advisor/dashboard" element={<AdvisorDashboard />} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;

