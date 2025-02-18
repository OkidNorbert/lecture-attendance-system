import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ScanQR = () => {
  const [scannedData, setScannedData] = useState(null);
  const [scanning, setScanning] = useState(true);
  const [studentLocation, setStudentLocation] = useState({ latitude: null, longitude: null });
  const navigate = useNavigate();

  // ✅ Automatically fetch Student's GPS Location on page load
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStudentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => alert("⚠️ Location access denied. Please enable location services."),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
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
        (error) => console.warn("⚠️ QR Scan Error: ", error) // Avoid blocking UI with errors
      );

      return () => scanner.clear(); // Cleanup when component unmounts
    }
  }, [scanning]);

  const markAttendance = async (qrData) => {
    const token = localStorage.getItem("token");
  
    if (!token) {
      alert("❌ Please log in as a student.");
      navigate("/login");
      return;
    }
  
    if (!studentLocation.latitude || !studentLocation.longitude) {
      alert("❌ Unable to fetch your location. Please enable GPS.");
      return;
    }
  
    try {
      console.log("✅ Raw Scanned QR Code:", qrData); // Log raw QR data
      const parsedData = JSON.parse(qrData); // Convert scanned text to JSON
      console.log("✅ Parsed QR Code Data:", parsedData); // Log parsed JSON
  
      if (!parsedData.course || !parsedData.date || !parsedData.sessionId) {
        alert("❌ Invalid QR Code. Missing required fields.");
        return;
      }
  
      const res = await axios.post(
        "http://localhost:5000/api/attendance/mark",
        {
          course: parsedData.course,
          date: parsedData.date,
          sessionId: parsedData.sessionId,
          studentLat: studentLocation.latitude,
          studentLon: studentLocation.longitude,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      alert(`✅ ${res.data.msg}`);
    } catch (err) {
      console.error("❌ Attendance Marking Error:", err);
      alert(err.response?.data?.msg || "❌ Error marking attendance");
    }
  };
  

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">📸 Scan QR Code for Attendance</h2>
      {scanning ? <div id="qr-reader"></div> : <p>✅ QR Code Scanned!</p>}
      {scannedData && <p className="text-green-600 font-semibold mt-2">QR Code Data: {scannedData}</p>}
      <button
        onClick={() => setScanning(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
      >
        🔄 Scan Again
      </button>
    </div>
  );
};

export default ScanQR;
