import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Fetch user details (if needed)
    axios.get("http://localhost:5000/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setUser(res.data))
      .catch(() => navigate("/login"));
  }, [navigate]);

  return (
    <div>
      <h2>Dashboard</h2>
      {user ? <p>Welcome, {user.name}!</p> : <p>Loading...</p>}
      <button onClick={() => { localStorage.removeItem("token"); navigate("/login"); }}>
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
