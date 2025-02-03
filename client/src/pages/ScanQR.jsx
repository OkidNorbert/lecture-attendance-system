import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ScanQR = () => {
  const [scannedData, setScannedData] = useState(null);
  const [scanning, setScanning] = useState(true);
  const [studentLocation, setStudentLocation] = useState({ latitude: null, longitude: null });
  const navigate = useNavigate();

  // ✅ Get Student's GPS Location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => setStudentLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => alert("Location access denied. Please enable location services.")
    );
  }, []);

  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 });

      scanner.render(
        (success) => {
          setScannedData(success);
          scanner.clear();
          setScanning(false); // Stop scanning after success
          markAttendance(success);
        },
        (error) => console.error("QR Scan Error: ", error)
      );

      return () => scanner.clear(); // Cleanup when component unmounts
    }
  }, [scanning]);

  const markAttendance = async (qrData) => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please log in as a student.");
      navigate("/login");
      return;
    }

    if (!studentLocation.latitude || !studentLocation.longitude) {
      alert("Unable to fetch your location. Please enable GPS.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/attendance/mark", 
      { qrData, studentLat: studentLocation.latitude, studentLon: studentLocation.longitude }, 
      {
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
      {scanning ? <div id="qr-reader"></div> : <p>✅ QR Code Scanned!</p>}
      {scannedData && <p>QR Code Data: {scannedData}</p>}
      <button onClick={() => setScanning(true)}>🔄 Scan Again</button>
    </div>
  );
};

export default ScanQR;
