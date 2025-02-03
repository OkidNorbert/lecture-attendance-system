const express = require("express");
const authMiddleware = require("../middleware/auth");
const Attendance = require("../models/Attendance");
const router = express.Router();

// ✅ Mark Attendance (Only for Students)
router.post("/mark", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ msg: "Access denied. Only students can mark attendance." });
    }

    const { qrData } = req.body;
    if (!qrData) return res.status(400).json({ msg: "No QR data found" });

    // Extract QR Data (course, date, session)
    const { course, date, sessionId } = JSON.parse(qrData);

    // Prevent duplicate attendance
    const existingRecord = await Attendance.findOne({ studentId: req.user.id, sessionId });
    if (existingRecord) return res.status(400).json({ msg: "Attendance already marked!" });

    // Save Attendance Record
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

module.exports = router;

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
