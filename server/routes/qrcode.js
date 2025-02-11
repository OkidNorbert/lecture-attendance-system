const express = require("express");
const QRCode = require("qrcode");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

// ✅ Generate QR Code with Required Fields
router.post("/generate", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "lecturer") {
      return res.status(403).json({ msg: "Access denied. Only lecturers can generate QR codes." });
    }

    const { course, sessionId, duration, latitude, longitude, radius } = req.body;

    // ✅ Validate Required Fields
    if (!course || !sessionId || !duration || !latitude || !longitude || !radius) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    const expiryTime = Date.now() + duration * 60 * 1000; // Expiry timestamp

    // ✅ Store Only Essential Data
    const qrData = JSON.stringify({ 
      c: course, 
      s: sessionId, 
      e: expiryTime, 
      lat: latitude, 
      lon: longitude, 
      r: radius 
    });

    // ✅ Generate QR Code
    const qrCodeUrl = await QRCode.toDataURL(qrData, { errorCorrectionLevel: "L" });

    res.json({ msg: "QR Code generated successfully", qrCodeUrl, expiryTime });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

module.exports = router;
