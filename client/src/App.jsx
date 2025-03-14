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
import ProgramManagement from './components/admin/ProgramManagement';

function App() {
  return (
    <Routes>
      {/* Home/Login route */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Navigate to="/" replace />} />

      {/* Dashboard routes */}
      <Route path="/admin/*" element={<AdminDashboard />} />
      <Route path="/admin/programs" element={<ProgramManagement />} />
      <Route path="/lecturer" element={<LecturerDashboard />} />
      <Route path="/student" element={<StudentDashboard />} />

      {/* Catch all route - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// function App() {
//   return (
//     <Routes>
//       <Route path="/" element={<Home />} />
      
//       {/* Admin Routes */}
//       <Route 
//         path="/admin/*" 
//         element={
//           <AdminRoute>
//             <AdminDashboard />
//           </AdminRoute>
//         }
//       />

//       {/* Lecturer Routes */}
//       <Route 
//         path="/lecturer/*" 
//         element={
//           <LecturerRoute>
//             <LecturerDashboard />
//           </LecturerRoute>
//         }
//       />

//       {/* Shared Routes */}
//       <Route path="/attendance-history" element={<AttendanceHistory />} />
//       <Route path="/generate-qr" element={<GenerateQR />} />
//       <Route path="/dashboard" element={<LecturerDashboard />} />

//       {/* Student Routes */}
//       <Route 
//         path="/student/*" 
//         element={
//           <StudentRoute>
//             <StudentDashboard />
//           </StudentRoute>
//         }
//       />
//     </Routes>
//   );
// }



export default App; 