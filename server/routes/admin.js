const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/auth");
const User = require("../models/User");
const Course = require("../models/Course");
const Attendance = require("../models/Attendance");
const Session = require("../models/Session");

const router = express.Router();

// ✅ Ensure only admin can access these routes
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "❌ Access denied. Admins only." });
  }
  next();
};

// 🔹 1️⃣ Register a Lecturer
router.post("/register-lecturer", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, email, courses, courseUnit, year, semester } = req.body;
    
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "❌ Lecturer already exists" });

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    user = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      role: "lecturer",
      courses,
      courseUnit,
      year,
      semester,
      isApproved: false // New lecturers need approval
    });
    await user.save();

    res.status(201).json({ msg: "✅ Lecturer registered successfully", tempPassword });
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// 🔹 2️⃣ Assign Course to Lecturer
router.post("/assign-course", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { lecturerId, courseId } = req.body;
    const lecturer = await User.findById(lecturerId);
    const course = await Course.findById(courseId);
    
    if (!lecturer || lecturer.role !== "lecturer") return res.status(404).json({ msg: "Lecturer not found" });
    if (!course) return res.status(404).json({ msg: "Course not found" });
    
    lecturer.courses.push(courseId);
    await lecturer.save();
    
    res.json({ msg: "✅ Course assigned successfully" });
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// 🔹 3️⃣ View All Users (Students & Lecturers)
router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, "name email role");
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// 🔹 4️⃣ Monitor Attendance Records
router.get("/attendance", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const records = await Attendance.find().sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// 🔹 5️⃣ View Active Attendance Sessions
router.get("/active-sessions", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const activeSessions = await Session.find({ expiryTime: { $gt: Date.now() } });
    res.json(activeSessions);
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// 🔹 6️⃣ Approve Lecturer Registration
router.put("/approve-lecturer/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const lecturer = await User.findById(req.params.id);
    if (!lecturer || lecturer.role !== "lecturer") {
      return res.status(404).json({ msg: "Lecturer not found" });
    }
    
    lecturer.isApproved = true;
    await lecturer.save();
    
    res.json({ msg: "✅ Lecturer approved successfully" });
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// 🔹 7️⃣ Reset User Password
router.post("/reset-password/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    user.password = hashedPassword;
    await user.save();
    
    res.json({ msg: "✅ Password reset successfully", tempPassword });
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// 🔹 8️⃣ Generate Attendance Report
router.get("/attendance-report", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { courseId, lecturerId, studentId, startDate, endDate } = req.query;
    let query = {};
    
    if (courseId) query.courseId = courseId;
    if (lecturerId) query.lecturerId = lecturerId;
    if (studentId) query.studentId = studentId;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const records = await Attendance.find(query)
      .populate('studentId', 'name email')
      .populate('courseId', 'name code')
      .sort({ date: -1 });
    
    res.json(records);
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// Update the admin registration to include super admin check
router.post("/register-admin", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!req.user.isSuperAdmin) {
      return res.status(403).json({ msg: "❌ Only super admins can register new admins" });
    }

    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "❌ Admin already exists" });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      role: "admin" 
    });
    await user.save();
    
    res.status(201).json({ msg: "✅ Admin registered successfully" });
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// Add the admin login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.role !== "admin") {
      return res.status(400).json({ msg: "❌ Invalid credentials" });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "❌ Invalid credentials" });
    
    const token = jwt.sign(
      { id: user._id, role: "admin", isSuperAdmin: user.isSuperAdmin }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );
    
    res.json({ msg: "✅ Login successful", token });
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// 🔹 1️⃣ Remove Lecturer or Student
router.delete("/remove-user/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ msg: "❌ User not found" });

    res.json({ msg: `✅ ${user.role} removed successfully` });
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// 🔹 2️⃣ View All Courses
router.get("/courses", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// 🔹 3️⃣ Remove a Course
router.delete("/remove-course/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ msg: "❌ Course not found" });

    res.json({ msg: "✅ Course removed successfully" });
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// 🔹 4️⃣ Generate Lecturer Performance Report
router.get("/lecturer-performance/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const lecturer = await User.findById(req.params.id);
    if (!lecturer || lecturer.role !== "lecturer") {
      return res.status(404).json({ msg: "❌ Lecturer not found" });
    }

    const sessions = await Session.find({ lecturer: req.params.id });
    const sessionIds = sessions.map(session => session._id);
    
    const attendanceRecords = await Attendance.find({ sessionId: { $in: sessionIds } });

    res.json({
      lecturer: lecturer.name,
      courses: lecturer.courses,
      totalSessions: sessions.length,
      totalAttendanceMarked: attendanceRecords.length
    });
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// 🔹 5️⃣ Student Attendance Trend Report
router.get("/student-attendance-trends", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const trends = await Attendance.aggregate([
      { $group: { _id: "$date", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json(trends);
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

module.exports = router;
