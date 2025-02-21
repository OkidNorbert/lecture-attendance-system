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

  // ✅ Fetch User Details & GPS on Page Load
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("❌ Please log in as a student.");
      navigate("/login");
      return;
    }

    // ✅ Fetch user details (ensure role is student)
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

    // ✅ Fetch GPS location before enabling scanning
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStudentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGpsFetched(true);
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
    if (gpsFetched && user?.role === "student") {
      setScanning(true); // ✅ Only start scanning when GPS is fetched & user verified
    }
  }, [gpsFetched, user]);

  // ✅ Initialize Scanner AFTER Component is Mounted
  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 });

      setTimeout(() => {
        if (document.getElementById("qr-reader")) {
          scanner.render(
            (success) => {
              setScannedData(success);
              scanner.clear();
              setScanning(false); // Stop scanning after success
              markAttendance(success);
            },
            (error) => console.warn("⚠️ QR Scan Error: ", error)
          );
        } else {
          console.error("❌ QR Reader div not found. Ensure it's rendered in JSX.");
        }
      }, 500); // Delay to ensure div is loaded

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

    if (!gpsFetched || !studentLocation.latitude || !studentLocation.longitude) {
      alert("❌ Unable to fetch your location. Please enable GPS.");
      return;
    }

    try {
      console.log("✅ Raw Scanned QR Code:", qrData);
      const parsedData = JSON.parse(qrData);
      console.log("✅ Parsed QR Code Data:", parsedData);

      // ✅ Ensure QR Code contains required fields
      if (!parsedData.course || !parsedData.date || !parsedData.sessionId) {
        alert("❌ Invalid QR Code. Missing required fields.");
        return;
      }

      // ✅ Fetch user details to get student name (only once)
      if (!user?.name) {
        alert("❌ Unable to fetch student name. Please try again.");
        return;
      }

      const res = await axios.post(
        "http://localhost:5000/api/attendance/mark",
        {
          course: parsedData.course,
          date: parsedData.date, // ✅ Ensure date is included
          sessionId: parsedData.sessionId,
          name: user.name, // ✅ Ensure student name is included
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
      
      {!gpsFetched ? (
        <p className="text-gray-500">⏳ Fetching GPS location...</p>
      ) : (
        <div id="qr-reader" className="border p-2"></div>
      )}

      {scannedData && (
        <div className="mt-2 p-2 bg-gray-100 border rounded">
          <h3 className="text-lg font-semibold">✅ QR Code Data:</h3>
          <pre className="text-sm text-gray-800">{JSON.stringify(JSON.parse(scannedData), null, 2)}</pre>
        </div>
      )}

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
