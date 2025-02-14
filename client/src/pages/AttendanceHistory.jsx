import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AttendanceHistory = () => {
  const [records, setRecords] = useState([]);
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
      .catch(() => alert("❌ Error fetching attendance records"));
  }, [navigate]);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">📜 My Attendance History</h2>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Course</th>
            <th className="border p-2">Date</th>
            <th className="border p-2">Session ID</th>
          </tr>
        </thead>
        <tbody>
          {records.length > 0 ? (
            records.map((record, index) => (
              <tr key={index} className="text-center border-b">
                <td className="border p-2">{record.course}</td>
                <td className="border p-2">{new Date(record.date).toLocaleString()}</td>
                <td className="border p-2">{record.sessionId}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="p-3 text-gray-500 text-center">No records found</td>
            </tr>
          )}
        </tbody>
      </table>

      <button
        onClick={() => navigate("/scan")}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        🔄 Scan Another QR Code
      </button>
    </div>
  );
};

export default AttendanceHistory;
