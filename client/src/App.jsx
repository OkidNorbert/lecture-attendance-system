import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import LecturerDashboard from './pages/LecturerDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AttendanceHistory from './pages/AttendanceHistory';
import GenerateQR from './pages/GenerateQR';
import AdminRoute from './components/auth/AdminRoute';
import LecturerRoute from './components/auth/LecturerRoute';
import StudentRoute from './components/auth/StudentRoute';
import SessionDetails from './pages/SessionDetails';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      
      {/* Admin Routes */}
      <Route 
        path="/admin/*" 
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      {/* Lecturer Routes */}
      <Route 
        path="/lecturer/*" 
        element={
          <LecturerRoute>
            <LecturerDashboard />
          </LecturerRoute>
        }
      />

      {/* Shared Routes */}
      <Route path="/attendance-history" element={<AttendanceHistory />} />
      <Route path="/generate-qr" element={<GenerateQR />} />
      <Route path="/dashboard" element={<LecturerDashboard />} />

      {/* Student Routes */}
      <Route 
        path="/student/*" 
        element={
          <StudentRoute>
            <StudentDashboard />
          </StudentRoute>
        }
      />

      <Route 
        path="/session-details/:id" 
        element={
          <LecturerRoute>
            <SessionDetails />
          </LecturerRoute>
        }
      />
    </Routes>
  );
}

export default App; 