import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Container, Box, Typography } from '@mui/material';
import LogoutButton from '../components/LogoutButton';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Fetch users & sessions
    axios
      .get("http://localhost:5000/api/admin/users", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setUsers(res.data))
      .catch(() => alert("❌ Error fetching users"));

    axios
      .get("http://localhost:5000/api/admin/sessions", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setSessions(res.data))
      .catch(() => alert("❌ Error fetching sessions"))
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <Container maxWidth="xl">
      <LogoutButton />
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
      </Box>
      <div className="max-w-5xl mx-auto p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-bold mb-4">⚙️ Admin Dashboard</h2>
        {loading ? <p>Loading...</p> : (
          <>
            <section className="mb-6">
              <h3 className="text-xl font-semibold">👥 Manage Users</h3>
              <table className="w-full border-collapse border border-gray-300 mt-3">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-3">Name</th>
                    <th className="border p-3">Email</th>
                    <th className="border p-3">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b">
                      <td className="border p-3">{user.name}</td>
                      <td className="border p-3">{user.email}</td>
                      <td className="border p-3">{user.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section>
              <h3 className="text-xl font-semibold">�� Active Sessions</h3>
              <ul className="mt-3">
                {sessions.map((session) => (
                  <li key={session.sessionId} className="border p-3 rounded mb-2">
                    {session.course} - {session.sessionId} (📍 {session.lecturer})
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </Container>
  );
};

export default AdminDashboard;
