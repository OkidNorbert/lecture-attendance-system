const express = require("express");
const qr = require("qr-image");
const authMiddleware = require("../middleware/auth");
const Session = require("../models/Session"); 
const router = express.Router();

// ✅ Generate QR Code (Only for Lecturers)
router.post("/generate", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "lecturer") {
      return res.status(403).json({ msg: "❌ Access denied. Only lecturers can generate QR codes." });
    }

    const { course, sessionId, duration, latitude, longitude, radius } = req.body;

    if (!course || !sessionId || !duration || !latitude || !longitude || !radius) {
      return res.status(400).json({ msg: "❌ Missing required fields" });
    }

    const expiryTime = Date.now() + duration * 60 * 1000; // ✅ Compute Expiry Time
    const date = new Date().toISOString().split("T")[0]; // ✅ Generate today's date
    
    // ✅ Store session in database (prevent duplicate sessionId)
    await Session.findOneAndUpdate(
      { sessionId },
      { 
        sessionId,
        lecturerId: req.user.id,
        program: course, // Store the course name as program
        expiryTime,
        location: {
          latitude,
          longitude
        },
        radius,
        status: 'active'
      },
      { new: true, upsert: true }
    );

    // ✅ Embed Expiry Time Inside QR Code
    const qrData = JSON.stringify({ course, date, sessionId, lecturer: req.user.name, expiryTime });

    console.log("✅ QR Code Data:", qrData);

    const qrCodeImage = qr.imageSync(qrData, { type: "png" }); // ✅ Generate QR Code Image
    const qrCodeBase64 = `data:image/png;base64,${qrCodeImage.toString("base64")}`;

    res.json({ 
      msg: "✅ QR Code generated successfully", 
      qrCodeUrl: qrCodeBase64, 
      expiryTime 
    });
  } catch (err) {
    console.error("❌ Error in QR Code Generation:", err.message);
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

module.exports = router;
