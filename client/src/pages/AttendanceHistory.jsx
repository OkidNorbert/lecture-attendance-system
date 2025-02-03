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

    axios.get("http://localhost:5000/api/attendance/history", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => setRecords(res.data))
    .catch(() => alert("Error fetching attendance records"));
  }, [navigate]);

  return (
    <div>
      <h2>My Attendance History</h2>
      <table border="1">
        <thead>
          <tr>
            <th>Course</th>
            <th>Date</th>
            <th>Session ID</th>
          </tr>
        </thead>
        <tbody>
          {records.length > 0 ? (
            records.map((record, index) => (
              <tr key={index}>
                <td>{record.course}</td>
                <td>{record.date}</td>
                <td>{record.sessionId}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="3">No records found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceHistory;
