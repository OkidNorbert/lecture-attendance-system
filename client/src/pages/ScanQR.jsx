import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ScanQR = () => {
  const [scannedData, setScannedData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 });
    scanner.render(success => {
      setScannedData(success);
      scanner.clear();
      markAttendance(success);
    });
  }, []);

  const markAttendance = async (qrData) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in as a student.");
      navigate("/login");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/attendance/mark", { qrData }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(res.data.msg);
    } catch (err) {
      alert(err.response?.data?.msg || "Error marking attendance");
    }
  };

  return (
    <div>
      <h2>Scan QR Code for Attendance</h2>
      <div id="qr-reader"></div>
      {scannedData && <p>QR Code Scanned: {scannedData}</p>}
    </div>
  );
};

export default ScanQR;
