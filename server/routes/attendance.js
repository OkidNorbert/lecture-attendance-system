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

    const { qrData, studentLat, studentLon } = req.body;
    if (!qrData || studentLat === undefined || studentLon === undefined) {
      return res.status(400).json({ msg: "QR data and location required" });
    }

    const { course, date, sessionId, expiryTime, latitude, longitude, radius } = JSON.parse(qrData);

    // ✅ Check if QR code is expired
    if (Date.now() > expiryTime) {
      return res.status(400).json({ msg: "QR Code has expired!" });
    }

    // ✅ Check if student is within the allowed radius
    const distance = getDistance(latitude, longitude, studentLat, studentLon);
    if (distance > radius) {
      return res.status(400).json({ msg: "You are not in the classroom!" });
    }

    // ✅ Prevent duplicate attendance
    const existingRecord = await Attendance.findOne({ studentId: req.user.id, sessionId });
    if (existingRecord) return res.status(400).json({ msg: "Attendance already marked!" });

    // ✅ Save Attendance Record
    const attendance = new Attendance({
      studentId: req.user.id,
      name: req.user.name,
      course,
      date,
      sessionId,
    });

    await attendance.save();
    res.json({ msg: "Attendance marked successfully!" });
  } catch (err) {
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
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ msg: "Access denied. Only students can view attendance history." });
    }

    const records = await Attendance.find({ studentId: req.user.id }).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ✅ Lecturer Attendance Dashboard
router.get("/course/:course", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "lecturer") {
      return res.status(403).json({ msg: "Access denied. Only lecturers can view attendance records." });
    }

    const { course } = req.params;
    const records = await Attendance.find({ course }).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

module.exports = router;
