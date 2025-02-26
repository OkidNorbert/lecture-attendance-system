import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Home = () => {
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">🎓 Lecture Attendance System</h1>
      <p className="text-gray-600 mb-4">Easily mark attendance using QR codes.</p>

      {isRegistering ? (
        <RegisterForm switchToLogin={() => setIsRegistering(false)} />
      ) : (
        <LoginForm switchToRegister={() => setIsRegistering(true)} />
      )}
    </div>
  );
};

// ✅ Login Form
const LoginForm = ({ switchToRegister }) => {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", form);
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.msg || "❌ Login failed.");
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">🔑 Login</h2>
      <form onSubmit={handleLogin} className="space-y-3">
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded w-full">
          Login
        </button>
      </form>
      <p className="mt-3 text-sm">
        Don't have an account?{" "}
        <button onClick={switchToRegister} className="text-blue-600 underline">
          Register
        </button>
      </p>
    </div>
  );
};

// ✅ Register Form
const RegisterForm = ({ switchToLogin }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", form);
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.msg || "❌ Registration failed.");
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">📝 Register</h2>
      <form onSubmit={handleRegister} className="space-y-3">
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />
        <select
          name="role"
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="student">Student</option>
          <option value="lecturer">Lecturer</option>
        </select>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded w-full">
          Register
        </button>
      </form>
      <p className="mt-3 text-sm">
        Already have an account?{" "}
        <button onClick={switchToLogin} className="text-green-600 underline">
          Login
        </button>
      </p>
    </div>
  );
};

export default Home;
