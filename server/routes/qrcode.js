const express = require("express");
const QRCode = require("qrcode");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

// ✅ Generate QR Code with Expiry & GPS Location
router.post("/generate", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "lecturer") {
      return res.status(403).json({ msg: "Access denied. Only lecturers can generate QR codes." });
    }

    const { course, date, sessionId, duration, latitude, longitude, radius } = req.body;

    if (!course || !date || !sessionId || !duration || !latitude || !longitude || !radius) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    const expiryTime = Date.now() + duration * 60 * 1000; // Expiry timestamp

    // Store all data inside QR code
    const qrData = JSON.stringify({ course, date, sessionId, expiryTime, latitude, longitude, radius });

    // Generate QR Code URL
    const qrCodeUrl = await QRCode.toDataURL(qrData);

    res.json({ msg: "QR Code generated successfully", qrCodeUrl, expiryTime });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

module.exports = router;
