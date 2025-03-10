import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import AdminDashboard from './components/admin/AdminDashboard';
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
      {/* Home/Login route */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Navigate to="/" replace />} />

      {/* Dashboard routes */}
      <Route path="/admin/*" element={<AdminDashboard />} />
      <Route path="/lecturer" element={<LecturerDashboard />} />
      <Route path="/student" element={<StudentDashboard />} />

      {/* Catch all route - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App; 