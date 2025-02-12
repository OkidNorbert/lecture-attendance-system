import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import QRCode from "react-qr-code";

const GenerateQR = () => {
  const [formData, setFormData] = useState({
    course: "",
    sessionId: "",
    duration: 5,
    latitude: "",
    longitude: "",
    radius: 50,
  });

  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGetLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
      },
      () => setError("Location access denied. Please enable GPS.")
    );
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please log in as a lecturer.");
      navigate("/login");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/qrcode/generate", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.data.qrCodeUrl) {
        throw new Error("QR Code generation failed.");
      }

      setQrCodeUrl(res.data.qrCodeUrl);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.msg || "Error generating QR Code");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">Generate QR Code</h2>
      <form onSubmit={handleGenerate} className="space-y-3">
        <input type="text" name="course" placeholder="Course Name" onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded" />
        <input type="text" name="sessionId" placeholder="Session ID" onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded" />
        <input type="number" name="duration" placeholder="Duration (minutes)" onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded" />
        <input type="number" name="radius" placeholder="Allowed Radius (meters)" onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded" />
        <button type="button" onClick={handleGetLocation} className="bg-blue-500 text-white px-4 py-2 rounded">📍 Use Current Location</button>
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Generate QR Code</button>
      </form>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {qrCodeUrl && (
        <div className="mt-4 text-center">
          <h3 className="text-lg font-semibold">Scan this QR Code</h3>
          <QRCode value={qrCodeUrl} size={200} level="L" />
        </div>
      )}
    </div>
  );
};

export default GenerateQR;
