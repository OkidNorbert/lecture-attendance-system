const express = require("express");
const QRCode = require("qrcode");
const authMiddleware = require("../middleware/auth");
const Session = require("../models/Session"); // Ensure this model exists
const router = express.Router();

// ✅ Generate QR Code (Only for Lecturers)
router.post("/generate", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "lecturer") {
      return res.status(403).json({ msg: "Access denied. Only lecturers can generate QR codes." });
    }

    const { course, sessionId, duration, latitude, longitude, radius } = req.body;

    if (!course || !sessionId || !duration || !latitude || !longitude || !radius) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    const expiryTime = Date.now() + duration * 60 * 1000;

    // ✅ Store session in database
    const session = new Session({ sessionId, course, expiryTime, latitude, longitude, radius });
    await session.save();

    // ✅ Store only sessionId in QR Code
    const qrData = JSON.stringify({ s: sessionId });
    console.log("✅ QR Code Data:", qrData);

    // ✅ Generate QR Code
    const qrCodeUrl = await QRCode.toDataURL(qrData, { errorCorrectionLevel: "L" });

    res.json({ msg: "QR Code generated successfully", qrCodeUrl, expiryTime });
  } catch (err) {
    console.error("❌ Error in QR Code Generation:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

module.exports = router;
