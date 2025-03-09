const express = require("express");
const authMiddleware = require("../middleware/auth");
const Attendance = require("../models/Attendance");
const Session = require("../models/Session"); // ✅ Ensure session validation
const router = express.Router();
const Course = require('../models/Course');

// ✅ Mark Attendance with Expiry Validation
router.post("/mark", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ msg: "❌ Access denied. Only students can mark attendance." });
    }

    console.log("📥 Received Attendance Data:", req.body);

    const { course, date, sessionId, studentLat, studentLon, name } = req.body;
    if (!course || !date || !sessionId || !studentLat || !studentLon || !name) {
      return res.status(400).json({ msg: "❌ Invalid QR Code data received" });
    }

    // ✅ Validate if session exists
    const session = await Session.findOne({ sessionId });
    if (!session) return res.status(404).json({ msg: "❌ Session not found or expired!" });

    // ✅ Check if QR Code has expired
    const currentTime = Date.now();
    if (currentTime > session.expiryTime) {
      return res.status(400).json({ msg: "❌ This QR Code has expired!" });
    }

    // ✅ Prevent duplicate attendance
    const existingRecord = await Attendance.findOne({ studentId: req.user.id, sessionId });
    if (existingRecord) return res.status(400).json({ msg: "❌ Attendance already marked!" });

    // ✅ Save attendance record
    const attendance = new Attendance({
      studentId: req.user.id,
      name,
      course,
      date,
      sessionId,
      studentLat,
      studentLon,
      timestamp: new Date().toLocaleTimeString("en-US", { hour12: false })
    });

    await attendance.save();
    res.json({ msg: "✅ Attendance marked successfully!" });
  } catch (err) {
    console.error("❌ Error saving attendance:", err);
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});



// ✅ Student Attendance History
router.get("/history", authMiddleware, async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ msg: "❌ Access denied. Only students can view attendance history." });
  }

  try {
    const records = await Attendance.find({ studentId: req.user.id }).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// ✅ Lecturer Attendance Dashboard
router.get("/lecturer", authMiddleware, async (req, res) => {
  if (req.user.role !== "lecturer") {
    return res.status(403).json({ msg: "❌ Access denied. Only lecturers can view attendance records." });
  }

  try {
    const records = await Attendance.find().sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
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

// @route   GET api/attendance/stats
// @desc    Get lecturer's attendance statistics
// @access  Private
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await Session.aggregate([
      { $match: { lecturerId: req.user.id } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalStudents: { $sum: '$totalStudents' },
          totalPresent: { $sum: '$presentCount' }
        }
      }
    ]);

    const result = stats[0] || { totalSessions: 0, totalStudents: 0, totalPresent: 0 };
    const averageAttendance = result.totalStudents > 0 
      ? Math.round((result.totalPresent / result.totalStudents) * 100) 
      : 0;

    res.json({
      totalSessions: result.totalSessions,
      totalStudents: result.totalStudents,
      averageAttendance
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/attendance/sessions
// @desc    Get filtered session records
// @access  Private
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    const { program, course, department, sessionDate, timeFrame } = req.query;
    let query = { lecturerId: req.user.id };

    if (program) query.program = program;
    if (course) query.courseId = course;
    if (department) query.department = department;
    if (sessionDate) {
      const date = new Date(sessionDate);
      query.createdAt = {
        $gte: date,
        $lt: new Date(date.setDate(date.getDate() + 1))
      };
    }
    if (timeFrame === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: today };
    }
    if (timeFrame === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query.createdAt = { $gte: weekAgo };
    }

    const sessions = await Session.find(query)
      .populate('courseId', 'name')
      .sort({ createdAt: -1 });

    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/attendance/session/:id
// @desc    Get detailed session information
// @access  Private
router.get('/session/:id', authMiddleware, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('courseId', 'name')
      .populate('attendees.studentId', 'name email');

    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    if (session.lecturerId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/attendance/export
// @desc    Export attendance records as JSON
// @access  Private
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const sessions = await Session.find({ lecturerId: req.user.id })
      .populate('courseId', 'name')
      .populate('attendees.studentId', 'name email');

    const exportData = sessions.map(session => ({
      date: session.createdAt,
      course: session.courseId.name,
      program: session.program,
      totalStudents: session.totalStudents,
      presentCount: session.presentCount,
      attendees: session.attendees.map(a => ({
        student: a.studentId.name,
        email: a.studentId.email,
        status: a.status,
        checkInTime: a.checkInTime
      }))
    }));

    res.json(exportData);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
