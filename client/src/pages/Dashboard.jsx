import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Fetch user details
    axios.get("http://localhost:5000/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setUser(res.data))
      .catch(err => {
        console.error("❌ Error fetching user data:", err);
        setError("Failed to load user details. Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="max-w-3xl mx-auto p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">📊 Dashboard</h2>

      {error ? (
        <p className="text-red-500">{error}</p>
      ) : user ? (
        <>
          <p className="text-gray-600">Welcome, <strong>{user.name}</strong>! 🎉</p>
          
          <nav className="mt-6 space-x-4">
            <Link to="/generate-qr" className="text-blue-500 font-semibold">📌 Generate QR</Link>
            <Link to="/scan-qr" className="text-green-500 font-semibold">📸 Scan QR</Link>
            <Link to="/attendance-history" className="text-purple-500 font-semibold">📜 View Attendance</Link>
          </nav>

          <button 
            onClick={handleLogout}
            className="mt-6 bg-red-500 text-white px-4 py-2 rounded"
          >
            🚪 Logout
          </button>
        </>
      ) : (
        <p className="text-gray-500">Loading user details...</p>
      )}
    </div>
  );
};

export default Dashboard;
