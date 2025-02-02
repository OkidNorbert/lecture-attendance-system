import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import QRCode from "react-qr-code";

const GenerateQR = () => {
  const [formData, setFormData] = useState({ course: "", date: "", sessionId: "" });
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      setQrCodeUrl(res.data.qrCodeUrl);
    } catch (err) {
      alert(err.response?.data?.msg || "Error generating QR Code");
    }
  };

  return (
    <div>
      <h2>Generate QR Code for Attendance</h2>
      <form onSubmit={handleGenerate}>
        <input type="text" name="course" placeholder="Course Name" onChange={handleChange} required />
        <input type="date" name="date" onChange={handleChange} required />
        <input type="text" name="sessionId" placeholder="Session ID" onChange={handleChange} required />
        <button type="submit">Generate QR Code</button>
      </form>

      {qrCodeUrl && (
        <div>
          <h3>Scan this QR Code</h3>
          <QRCode value={qrCodeUrl} size={200} />
        </div>
      )}
    </div>
  );
};

export default GenerateQR;
