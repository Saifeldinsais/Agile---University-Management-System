// src/App.jsx
import { Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import StudentLayout from "./layouts/StudentLayout";

import NotImplemented from "./pages/NotImplemented";

import Home from "./pages/Home";
// import Facilities from "./pages/Facilities";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Signup from "./pages/Signup";

import AdminDashboard from "./pages/admin/dashboard";
import AdminFacilities from "./pages/admin/AdminFacilities";


import StudentDashboard from "./pages/student/Dashboard";
import StudentHome from "./pages/student/Home";
import ElectiveSelection from "./pages/student/ElectiveSelection/ElectiveSelection";
import Timetable from "./pages/student/Timetable/Timetable";

import DoctorHome from "./pages/doctor/Home";

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

      {/* ADMIN PAGES (no navbar, full admin layout) */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/facilities" element={<AdminFacilities />} />
      <Route path="/admin/curriculum" element={<AdminCurriculum />} />


      {/* Student PAGES */}
      <Route path="student" element={<StudentLayout />} >
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="facilities" element={<NotImplemented />} />
        <Route path="electives" element={<ElectiveSelection />} />
        <Route path="timetable" element={<Timetable />} />
        <Route index element={<StudentHome />} />
      </Route>

      {/* Doctor/Teacher PAGES */}
      <Route path="doctor" element={<MainLayout />}>
        <Route index element={<DoctorHome />} />
        <Route path="courses" element={<NotImplemented />} />
        <Route path="students" element={<NotImplemented />} />
        <Route path="grades" element={<NotImplemented />} />
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

