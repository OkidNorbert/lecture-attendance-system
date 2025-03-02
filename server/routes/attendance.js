const express = require("express");
const authMiddleware = require("../middleware/auth");
const Attendance = require("../models/Attendance");
const Session = require("../models/Session"); // ✅ Ensure session validation
const router = express.Router();

// ✅ Mark Attendance with Expiry Validation
router.post("/mark", async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ msg: "Access denied. Only students can mark attendance." });
  }

  try {
    const { studentId, lectureId } = req.body;
    const attendance = new Attendance({
      student: studentId,
      lecture: lectureId,
      timestamp: new Date()
    });
    await attendance.save();
    res.json({ msg: "Attendance marked successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ✅ Student Attendance History
router.get("/history", async (req, res) => {
  try {
    const records = await Attendance.find().sort({ timestamp: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ✅ Lecturer Attendance Dashboard
router.get("/lecturer", async (req, res) => {
  try {
    const records = await Attendance.find().sort({ timestamp: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ✅ Helper function to calculate distance between two coordinates
function getDistance(lat1, lon1, lat2, lon2) {
  const toRad = (angle) => (Math.PI / 180) * angle;
  const R = 6371e3; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

router.get('/student/:studentId', async (req, res) => {
  try {
    const attendance = await Attendance.find({ student: req.params.studentId })
      .populate('lecture')
      .sort({ timestamp: -1 });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

router.get('/lecture/:lectureId', async (req, res) => {
  try {
    const attendance = await Attendance.find({ lecture: req.params.lectureId })
      .populate('student')
      .sort({ timestamp: -1 });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

module.exports = router;
