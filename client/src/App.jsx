import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import AdminDashboard from './components/admin/AdminDashboard';
import LecturerDashboard from './pages/LecturerDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AttendanceHistory from './pages/AttendanceHistory';
import GenerateQR from './pages/GenerateQR';
import ScanQR from './pages/ScanQR';
import AdminRoute from './components/auth/AdminRoute';
import LecturerRoute from './components/auth/LecturerRoute';
import StudentRoute from './components/auth/StudentRoute';
import SessionDetails from './pages/SessionDetails';
import ProgramManagement from './components/admin/ProgramManagement';
import FacultyManagement from './components/admin/FacultyManagement';
import SystemOverview from './components/admin/SystemOverview';
import AttendanceAnalytics from './components/admin/AttendanceAnalytics';
import EnrollmentManagement from './components/EnrollmentManagement';
import StudentCourseEnrollment from './components/StudentCourseEnrollment';
import CourseEnrollments from './components/lecturer/CourseEnrollments';
import CourseAttendance from './components/lecturer/CourseAttendance';
import LecturerCourses from './components/lecturer/LecturerCourses';

// Route guard for redirecting to role-specific dashboard
const DashboardRedirect = () => {
  const userRole = localStorage.getItem('userRole');
  
  if (userRole === 'admin') {
    return <Navigate to="/admin" replace />;
  } else if (userRole === 'lecturer') {
    return <Navigate to="/lecturer" replace />;
  } else if (userRole === 'student') {
    return <Navigate to="/student" replace />;
  } else {
    return <Navigate to="/" replace />;
  }
};

function App() {
  return (
    <Routes>
      {/* Home/Login route */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Navigate to="/" replace />} />

      {/* Dashboard routes with protection */}
      <Route 
        path="/admin/*" 
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route 
        path="/admin/programs" 
        element={
          <AdminRoute>
            <ProgramManagement />
          </AdminRoute>
        }
      />
      <Route 
        path="/admin/dashboard" 
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route 
        path="/admin/system-overview" 
        element={
          <AdminRoute>
            <SystemOverview />
          </AdminRoute>
        }
      />
      <Route 
        path="/admin/faculty-management" 
        element={
          <AdminRoute>
            <FacultyManagement />
          </AdminRoute>
        }
      />
      <Route 
        path="/admin/program-management" 
        element={
          <AdminRoute>
            <ProgramManagement />
          </AdminRoute>
        }
      />
      <Route 
        path="/admin/attendance-analytics" 
        element={
          <AdminRoute>
            <AttendanceAnalytics />
          </AdminRoute>
        }
      />
      <Route 
        path="/admin/enrollment-management" 
        element={
          <AdminRoute>
            <EnrollmentManagement />
          </AdminRoute>
        }
      />
      <Route 
        path="/lecturer/*" 
        element={
          <LecturerRoute>
            <LecturerDashboard />
          </LecturerRoute>
        }
      />
      <Route 
        path="/lecturer/courses" 
        element={
          <LecturerRoute>
            <LecturerCourses />
          </LecturerRoute>
        }
      />
      <Route 
        path="/course/:courseId/enrollments" 
        element={
          <LecturerRoute>
            <CourseEnrollments />
          </LecturerRoute>
        }
      />
      <Route 
        path="/course/:courseId/attendance" 
        element={
          <LecturerRoute>
            <CourseAttendance />
          </LecturerRoute>
        }
      />
      <Route 
        path="/student" 
        element={
          <StudentRoute>
            <StudentDashboard />
          </StudentRoute>
        }
      />
      <Route path="/dashboard" element={<DashboardRedirect />} />
      
      {/* Shared Routes with role-based protection */}
      <Route 
        path="/attendance-history" 
        element={
          <LecturerRoute>
            <AttendanceHistory />
          </LecturerRoute>
        }
      />
      <Route 
        path="/generate-qr" 
        element={
          <LecturerRoute>
            <GenerateQR />
          </LecturerRoute>
        }
      />
      <Route 
        path="/scan-qr" 
        element={
          <StudentRoute>
            <ScanQR />
          </StudentRoute>
        }
      />
      <Route 
        path="/enroll-courses" 
        element={
          <StudentRoute>
            <StudentCourseEnrollment />
          </StudentRoute>
        }
      />
      <Route 
        path="/session/:id" 
        element={
          <LecturerRoute>
            <SessionDetails />
          </LecturerRoute>
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

      {/* Catch all route - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App; 