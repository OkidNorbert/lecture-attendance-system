import { Routes, Route, Link } from "react-router-dom";
import ScanQR from "./pages/ScanQR";
import AttendanceHistory from "./pages/AttendanceHistory";

function App() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <nav className="flex justify-between bg-gray-200 p-4 rounded mb-4">
        <Link to="/" className="text-blue-600 font-bold">🏠 Home</Link>
        <Link to="/scan" className="text-green-600 font-bold">📸 Scan QR Code</Link>
        <Link to="/history" className="text-purple-600 font-bold">📜 Attendance History</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scan" element={<ScanQR />} />
        <Route path="/history" element={<AttendanceHistory />} />
      </Routes>
    </div>
  );
}

// ✅ Home Page Component
const Home = () => (
  <div className="text-center">
    <h1 className="text-2xl font-bold mb-4">🎓 Lecture Attendance System</h1>
    <p className="text-gray-600">Easily mark attendance using QR codes.</p>
    <p className="mt-4">Use the navigation above to scan a QR code or view your attendance history.</p>
  </div>
);

export default App;
