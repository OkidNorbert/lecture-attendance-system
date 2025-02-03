import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const LecturerDashboard = () => {
  const [records, setRecords] = useState([]);
  const [course, setCourse] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  const fetchRecords = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`http://localhost:5000/api/attendance/course/${course}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(res.data);
    } catch (err) {
      alert("Error fetching attendance records");
    }
  };

  return (
    <div>
      <h2>Lecturer Attendance Dashboard</h2>
      <input type="text" placeholder="Enter Course Name" value={course} onChange={(e) => setCourse(e.target.value)} />
      <button onClick={fetchRecords}>Fetch Attendance</button>

      <table border="1">
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Course</th>
            <th>Date</th>
            <th>Session ID</th>
          </tr>
        </thead>
        <tbody>
          {records.length > 0 ? (
            records.map((record, index) => (
              <tr key={index}>
                <td>{record.name}</td>
                <td>{record.course}</td>
                <td>{record.date}</td>
                <td>{record.sessionId}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="4">No records found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LecturerDashboard;
