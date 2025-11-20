// src/App.jsx
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

import Home from "./pages/Home";
// import Facilities from "./pages/Facilities";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Signup from "./pages/Signup";

import AdminDashboard from "./pages/admin/dashboard";
import AdminFacilities from "./pages/admin/AdminFacilities";

function App() {
  return (
    <Routes>
      {/* USER PAGES with Main layout + navbar */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        {/* <Route path="/facilities" element={<Facilities />} /> */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      {/* ADMIN PAGES (no navbar, full admin layout) */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/facilities" element={<AdminFacilities />} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
