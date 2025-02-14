const express = require("express");
const qr = require("qr-image");
const authMiddleware = require("../middleware/auth");
const Session = require("../models/Session"); 
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

    // ✅ Store session in database (update if exists)
    await Session.findOneAndUpdate(
      { sessionId },
      { course, expiryTime, latitude, longitude, radius },
      { new: true, upsert: true }
    );

    // ✅ Generate a modern QR Code (Use a JSON object)
    const qrData = JSON.stringify({ s: sessionId });
    console.log("✅ QR Code Data:", qrData);

    const qrCodeImage = qr.imageSync(qrData, { type: "png" });
    const qrCodeBase64 = `data:image/png;base64,${qrCodeImage.toString("base64")}`;

    res.json({ msg: "QR Code generated successfully", qrCodeUrl: qrCodeBase64, expiryTime });
  } catch (err) {
    console.error("❌ Error in QR Code Generation:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

module.exports = router;
