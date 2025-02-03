import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import "./index.css";
import GenerateQR from "./pages/GenerateQR";
import ScanQR from "./pages/ScanQR";
import AttendanceHistory from "./pages/AttendanceHistory";
import LecturerDashboard from "./pages/LecturerDashboard";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/generate-qr" element={<GenerateQR />} />
        <Route path="/scan-qr" element={<ScanQR />} />
        <Route path="/attendance-history" element={<AttendanceHistory />} />
        <Route path="/lecturer-dashboard" element={<LecturerDashboard />} />


      </Routes>
    </Router>
  </React.StrictMode>
);
