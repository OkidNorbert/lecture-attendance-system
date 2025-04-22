import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import jsQR from "jsqr";

const ScanQR = () => {
  const [scannedData, setScannedData] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [gpsFetched, setGpsFetched] = useState(false);
  const [studentLocation, setStudentLocation] = useState({ latitude: null, longitude: null });
  const [user, setUser] = useState(null);
  const [scannerError, setScannerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [processingUpload, setProcessingUpload] = useState(false);
  const fileInputRef = useRef(null);
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
        const errorMsg = getLocationErrorMessage(error);
        alert(`⚠️ ${errorMsg} Please enable GPS.`);
        console.error("❌ GPS Fetch Error:", error.message);
        setGpsFetched(false);
        setScannerError(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  const getLocationErrorMessage = (error) => {
    switch(error.code) {
      case error.PERMISSION_DENIED:
        return "Location access denied.";
      case error.POSITION_UNAVAILABLE:
        return "Location information unavailable.";
      case error.TIMEOUT:
        return "Location request timed out.";
      default:
        return "Location error occurred.";
    }
  };

  useEffect(() => {
    if (gpsFetched && user?.role === "student") {
      setScanning(true); // ✅ Only start scanning when GPS is fetched & user verified
    }
  }, [gpsFetched, user]);

  // ✅ Initialize Scanner AFTER Component is Mounted
  useEffect(() => {
    let scanner = null;
    
    if (scanning) {
      // Improved scanner configuration
      const scannerConfig = {
        fps: 15,
        qrbox: { width: 300, height: 300 },
        aspectRatio: window.innerWidth / window.innerHeight,
        disableFlip: false,
        formatsToSupport: [ 'QR_CODE' ],
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };
      
      try {
        scanner = new Html5QrcodeScanner(
          "qr-reader", 
          scannerConfig,
          /* verbose= */ false
        );

      setTimeout(() => {
        if (document.getElementById("qr-reader")) {
          scanner.render(
              (decodedText) => {
                try {
                  setScannedData(decodedText);
              scanner.clear();
              setScanning(false); // Stop scanning after success
                  setScannerError(null);
                  markAttendance(decodedText);
                } catch (err) {
                  console.error("Error processing scan:", err);
                  setScannerError("Error processing scan: " + err.message);
                }
              },
              (errorMessage) => {
                // QR Code scanning errors are not shown to user, as they're common during scanning
                console.warn("⚠️ QR Scan Error:", errorMessage);
                // Only set UI error for actual failures, not just "code not found" transient errors
                if (errorMessage && typeof errorMessage === 'string' && errorMessage.includes("Camera setup failed")) {
                  setScannerError("Camera access failed. Please check permissions.");
                } else if (errorMessage && errorMessage.toString) {
                  const errorString = errorMessage.toString();
                  if (errorString.includes("Camera setup failed")) {
                    setScannerError("Camera access failed. Please check permissions.");
                  }
                }
              }
          );
        } else {
            console.error("❌ QR Reader div not found.");
            setScannerError("QR scanner initialization failed. Please try again.");
          }
        }, 800); // Increased delay to ensure div is loaded
      } catch (err) {
        console.error("Scanner initialization error:", err);
        setScannerError("Failed to start camera: " + err.message);
      }

      // Cleanup function
      return () => {
        if (scanner) {
          try {
            scanner.clear();
          } catch (err) {
            console.error("Error cleaning up scanner:", err);
          }
        }
      };
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
      setScanning(true); // Restart scanning
      return;
    }
  
    try {
      setIsSubmitting(true);
      console.log("✅ Raw Scanned QR Code:", qrData);
      let parsedData;
      
      try {
        parsedData = JSON.parse(qrData);
      console.log("✅ Parsed QR Code Data:", parsedData);
      } catch (err) {
        setScannerError("Invalid QR Code format. Could not parse data.");
        setIsSubmitting(false);
        setScanning(true); // Restart scanning
        return;
      }
  
      if (!parsedData.course || !parsedData.date || !parsedData.sessionId || !parsedData.expiryTime) {
        setScannerError("Invalid QR Code. Missing required fields.");
        setIsSubmitting(false);
        setScanning(true); // Restart scanning
        return;
      }
  
      // ✅ Check if the QR Code is expired
      const currentTime = Date.now();
      if (currentTime > parsedData.expiryTime) {
        setScannerError("This QR Code has expired! Please get a new one.");
        setIsSubmitting(false);
        setScanning(true); // Restart scanning
        return;
      }
  
      // ✅ Ensure student name is available
      if (!user?.name) {
        setScannerError("Unable to fetch student name. Please try again.");
        setIsSubmitting(false);
        return;
      }
  
      const res = await axios.post(
        "http://localhost:5000/api/attendance/mark",
        {
          course: parsedData.course,
          date: parsedData.date,
          sessionId: parsedData.sessionId,
          name: user.name,
          studentLat: studentLocation.latitude,
          studentLon: studentLocation.longitude,
          // Include session location if available in QR
          lecturerLat: parsedData.latitude,
          lecturerLon: parsedData.longitude 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      setSuccessMessage(res.data.msg);
      setTimeout(() => {
        setScanning(true);
        setScannedData(null);
        setSuccessMessage("");
        setIsSubmitting(false);
      }, 3000);
    } catch (err) {
      console.error("❌ Attendance Marking Error:", err);
      setScannerError(err.response?.data?.msg || "Error marking attendance");
      setIsSubmitting(false);
      setTimeout(() => {
        setScanning(true); // Restart scanning on error after short delay
      }, 2000);
    }
  };

  // Update the handleFileUpload function to use jsQR
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show processing state
    setProcessingUpload(true);
    setScannerError(null);
    
    try {
      // Only process image files
      if (!file.type.match('image.*')) {
        setScannerError("Please select an image file");
        setProcessingUpload(false);
        return;
      }

      // Create a FileReader to read the image
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          // Create an image element to get dimensions
          const img = new Image();
          img.onload = async () => {
            try {
              // Create a canvas to draw the image
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0, img.width, img.height);
              
              // Get image data for QR code processing
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              
              // Process with jsQR
              const code = jsQR(imageData.data, imageData.width, imageData.height);
              
              if (code) {
                console.log("✅ QR Code detected from image:", code.data);
                // Process the QR code data
                markAttendance(code.data);
              } else {
                setScannerError("No QR code found in the image. Please try a clearer image or use the camera scanner.");
              }
            } catch (err) {
              console.error("QR processing error:", err);
              setScannerError("Failed to process the QR code: " + err.message);
            } finally {
              setProcessingUpload(false);
            }
          };
          
          img.onerror = () => {
            setScannerError("Failed to load the image");
            setProcessingUpload(false);
          };
          
          img.src = event.target.result;
        } catch (err) {
          console.error("Image processing error:", err);
          setScannerError("Failed to process the image: " + err.message);
          setProcessingUpload(false);
        }
      };
      
      reader.onerror = () => {
        setScannerError("Failed to read the file");
        setProcessingUpload(false);
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("File upload error:", err);
      setScannerError("Failed to process the file: " + err.message);
      setProcessingUpload(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">📸 Scan QR Code for Attendance</h2>
      
      {!gpsFetched ? (
        <div className="flex flex-col items-center bg-blue-50 p-4 rounded-lg">
          <p className="text-blue-700 mb-3 font-medium">⏳ Locating your position...</p>
          <div className="w-10 h-10 border-t-4 border-blue-500 rounded-full animate-spin mb-2"></div>
          <p className="text-sm text-gray-600">This ensures you're in the correct location for attendance</p>
        </div>
      ) : (
        <>
          {!isSubmitting && !successMessage && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-4 flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-green-700 text-sm">GPS location verified</span>
              </div>
              <div id="qr-reader" className="border-2 border-blue-500 rounded-lg p-2 overflow-hidden">
                <div className="text-center p-2 bg-blue-100 mb-2 rounded">
                  <p className="font-bold">Position the QR code within the frame</p>
                </div>
              </div>
              
              {/* Add file upload section */}
              <div className="mt-4 p-3 border border-gray-300 rounded-lg">
                <h3 className="font-bold text-gray-700 mb-2">📁 Or Upload QR Code Image</h3>
                <div className="flex items-center">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    disabled={processingUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className={`w-full py-2 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg ${
                      processingUpload ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={processingUpload}
                  >
                    {processingUpload ? "Processing..." : "Select Image"}
                  </button>
                </div>
                {processingUpload && (
                  <div className="mt-2 flex items-center justify-center">
                    <div className="w-6 h-6 border-t-2 border-indigo-500 rounded-full animate-spin mr-2"></div>
                    <span className="text-sm text-indigo-700">Processing image...</span>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  If camera scanning doesn't work, try uploading a QR code image
                </p>
              </div>
            </>
          )}
          
          {scannerError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mt-2 rounded relative">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{scannerError}</span>
            </div>
          )}
          
          {!isSubmitting && !successMessage && (
            <div className="mt-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <h3 className="font-bold text-yellow-800">📋 Scanning Tips:</h3>
              <ul className="list-disc ml-5 text-sm text-gray-700 mt-1">
                <li>Hold your phone steady</li>
                <li>Ensure good lighting on the QR code</li>
                <li>Make sure the entire QR code is visible in the camera</li>
                <li>Try different distances if scanning fails</li>
                <li>Clean your camera lens if the image is blurry</li>
              </ul>
            </div>
          )}
        </>
      )}

      {isSubmitting && (
        <div className="mt-4 p-4 bg-blue-100 border-2 border-blue-500 rounded-lg flex flex-col items-center">
          <h3 className="text-lg font-semibold text-blue-800">🔄 Processing Attendance</h3>
          <div className="mt-3 w-12 h-12 border-t-4 border-blue-500 rounded-full animate-spin"></div>
          <p className="mt-2 text-sm text-blue-700">Verifying location and registering attendance...</p>
        </div>
      )}

      {successMessage && (
        <div className="mt-4 p-4 bg-green-100 border-2 border-green-500 rounded-lg">
          <div className="flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <h3 className="text-lg font-semibold text-green-800">{successMessage}</h3>
          </div>
          <p className="text-center mt-2 text-sm text-green-700">You'll be able to scan again in a moment...</p>
        </div>
      )}

      <button
        onClick={() => {
          setScanning(true);
          setScannerError(null);
          setScannedData(null);
          setSuccessMessage("");
        }}
        disabled={isSubmitting || processingUpload}
        className={`w-full mt-4 font-bold py-3 px-4 rounded-lg flex items-center justify-center ${
          isSubmitting || processingUpload
            ? "bg-gray-400 cursor-not-allowed" 
            : "bg-blue-500 hover:bg-blue-600 text-white"
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7.805V10a1 1 0 01-2 0V3a1 1 0 011-1z" clipRule="evenodd" />
          <path fillRule="evenodd" d="M12.293 8.293a1 1 0 011.414 0l2 2a1 1 0 010 1.414l-2 2a1 1 0 01-1.414-1.414L13.586 11H7a1 1 0 110-2h6.586l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        {isSubmitting ? "Processing..." : "Scan Again"}
      </button>
    </div>
  );
};

export default ScanQR;
