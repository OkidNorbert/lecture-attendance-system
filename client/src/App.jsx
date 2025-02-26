import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home"; // ✅ Import Home
import Dashboard from "./pages/Dashboard";
import GenerateQR from "./pages/GenerateQR";
import ScanQR from "./pages/ScanQR";
import AttendanceHistory from "./pages/AttendanceHistory";
import LecturerDashboard from "./pages/LecturerDashboard";

const App = () => {
  return (
      <div className="max-w-3xl mx-auto p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/generate-qr" element={<GenerateQR />} />
          <Route path="/scan-qr" element={<ScanQR />} />
          <Route path="/attendance-history" element={<AttendanceHistory />} />
          <Route path="/lecturer-dashboard" element={<LecturerDashboard />} />
        </Routes>
      </div>
  );
};

export default App;
