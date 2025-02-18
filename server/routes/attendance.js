const express = require("express");
const authMiddleware = require("../middleware/auth");
const Attendance = require("../models/Attendance");
const router = express.Router();

// ✅ Mark Attendance with GPS Validation
router.post("/mark", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ msg: "Access denied. Only students can mark attendance." });
    }

    console.log("📥 Received Attendance Data:", req.body); // Debug log

    const { course, date, sessionId, studentLat, studentLon } = req.body;
    if (!course || !date || !sessionId || !studentLat || !studentLon) {
      console.error("❌ Invalid QR Code Data:", req.body);
      return res.status(400).json({ msg: "❌ Invalid QR Code data received" });
    }

    // Prevent duplicate attendance
    const existingRecord = await Attendance.findOne({ studentId: req.user.id, sessionId });
    if (existingRecord) {
      return res.status(400).json({ msg: "❌ Attendance already marked!" });
    }

    // Save Attendance Record
    const attendance = new Attendance({
      studentId: req.user.id,
      name: req.user.name,
      course,
      date,
      sessionId,
      studentLat,
      studentLon,
    });

    await attendance.save();
    res.json({ msg: "✅ Attendance marked successfully!" });
  } catch (err) {
    console.error("❌ Error saving attendance:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});



// ✅ Helper function to calculate distance between two coordinates
function getDistance(lat1, lon1, lat2, lon2) {
  const toRad = (angle) => (Math.PI / 180) * angle;
  const R = 6371e3; // Earth’s radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

// ✅ Student Attendance History
router.get("/history", authMiddleware, async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ msg: "Access denied. Only students can view attendance history." });
  }

  try {
    const records = await Attendance.find({ studentId: req.user.id }).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ✅ Lecturer Attendance Dashboard
router.get("/lecturer", authMiddleware, async (req, res) => {
  if (req.user.role !== "lecturer") {
    return res.status(403).json({ msg: "Access denied. Only lecturers can view attendance records." });
  }

  try {
    const records = await Attendance.find().sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

module.exports = router;
