import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ScanQR = () => {
  const [scannedData, setScannedData] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [gpsFetched, setGpsFetched] = useState(false);
  const [studentLocation, setStudentLocation] = useState({ latitude: null, longitude: null });
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // ✅ Fetch User Details & GPS on page load
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("❌ Please log in as a student.");
      navigate("/login");
      return;
    }

    // ✅ Fetch user details
    axios
      .get("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUser(res.data);
        if (res.data.role !== "student") {
          alert("❌ Access denied. Only students can mark attendance.");
          navigate("/dashboard");
        }
      })
      .catch(() => {
        alert("❌ Session expired. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      });

    // ✅ Fetch GPS location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStudentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGpsFetched(true);
        setScanning(true); // ✅ Start scanning after GPS is fetched
      },
      (error) => {
        alert("⚠️ Location access denied. Please enable GPS.");
        console.error("❌ GPS Fetch Error:", error.message);
        setGpsFetched(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (scanning && gpsFetched && user?.role === "student") {
      const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 });

      scanner.render(
        (success) => {
          if (!gpsFetched || !studentLocation.latitude || !studentLocation.longitude) {
            alert("❌ Unable to fetch your location. Please enable GPS.");
            setScanning(true); // 🔄 Restart scanning if GPS is missing
            return;
          }

          setScannedData(success);
          scanner.clear();
          setScanning(false); // Stop scanning after success
          markAttendance(success);
        },
        (error) => console.warn("⚠️ QR Scan Error: ", error)
      );

      return () => scanner.clear(); // Cleanup when component unmounts
    }
  }, [scanning, gpsFetched, user]);

  const markAttendance = async (qrData) => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("❌ Please log in as a student.");
      navigate("/login");
      return;
    }

    if (!gpsFetched || !studentLocation.latitude || !studentLocation.longitude) {
      alert("❌ Unable to fetch your location. Please enable GPS.");
      setScanning(true); // 🔄 Restart scanning if GPS is missing
      return;
    }

    try {
      console.log("✅ Raw Scanned QR Code:", qrData);
      const parsedData = JSON.parse(qrData);
      console.log("✅ Parsed QR Code Data:", parsedData);

      if (!parsedData.course || !parsedData.date || !parsedData.sessionId) {
        alert("❌ Invalid QR Code. Missing required fields.");
        setScanning(true); // 🔄 Restart scanning
        return;
      }

      const res = await axios.post(
        "http://localhost:5000/api/attendance/mark",
        {
          name: user.name, // ✅ Ensure student name is included
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
      setScanning(true); // 🔄 Restart scanning on error
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">📸 Scan QR Code for Attendance</h2>
      {!gpsFetched ? (
        <p className="text-gray-500">⏳ Fetching GPS location...</p>
      ) : scanning ? (
        <div id="qr-reader"></div>
      ) : (
        <p>✅ QR Code Scanned!</p>
      )}
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
