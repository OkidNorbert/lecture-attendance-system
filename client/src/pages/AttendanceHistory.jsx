import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AttendanceHistory = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get("http://localhost:5000/api/attendance/history", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        // ✅ Sort records by latest date first
        const sortedRecords = res.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecords(sortedRecords);
      })
      .catch(() => {
        setError("❌ Error fetching attendance records. Please try again later.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">📜 My Attendance History</h2>

      {/* ✅ Show loading state */}
      {loading ? (
        <p className="text-gray-500 text-center">⏳ Loading attendance records...</p>
      ) : error ? (
        <p className="text-red-500 text-center">{error}</p>
      ) : records.length > 0 ? (
        <table className="w-full border-collapse border border-gray-300 shadow-md">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-3">Course</th>
              <th className="border p-3">Date</th>
              <th className="border p-3">Session ID</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => (
              <tr key={index} className="text-center border-b">
                <td className="border p-3">{record.course}</td>
                <td className="border p-3">{new Date(record.date).toLocaleString()}</td>
                <td className="border p-3">{record.sessionId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500 text-center">📭 No attendance records found.</p>
      )}

      {/* ✅ Navigation Buttons */}
      <div className="flex justify-center space-x-4 mt-6">
        <button
          onClick={() => navigate("/scan-qr")}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          📸 Scan QR Code
        </button>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          🏠 Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default AttendanceHistory;
