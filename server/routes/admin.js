const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/auth");
const User = require("../models/User");
const Course = require("../models/Course");
const Attendance = require("../models/Attendance");
const Session = require("../models/Session");
const { sendTempPassword, sendWelcomeEmail } = require('../utils/emailService');
const Department = require("../models/Department");
const Program = require("../models/Program");
const Faculty = require('../models/Faculty');
const adminMiddleware = require('../middleware/admin');
const mongoose = require('mongoose');

const router = express.Router();

// 🔹 1️⃣ Register a Lecturer
router.post("/register-lecturer", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, email, department, role } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "❌ User already exists" });
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      department,
      isApproved: true
    });

    await user.save();

    // Send welcome email with credentials
    try {
      await sendWelcomeEmail(email, tempPassword, name, role);
      res.status(201).json({
        msg: "✅ User registered successfully. Login credentials sent to their email.",
        tempPassword,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department
        }
      });
    } catch (emailError) {
      // If email fails, still return success but with the password in response
      console.error('Email sending failed:', emailError);
      res.status(201).json({
        msg: "✅ User registered, but email failed. Temporary password: " + tempPassword,
        tempPassword,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department
        }
      });
    }
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
    const { role } = req.query;
    console.log(`Fetching users with role: ${role}`);

    // Add debug logging
    console.log('Query params:', req.query);
    console.log('Looking for role:', role);

    let query = {};
    if (role) {
      query = { 
        role: role,
        isApproved: true // Only get approved users
      };
    }

    const users = await User.find(query)
      .select('name email role department')
      .populate('department', 'name')
      .sort({ name: 1 });

    // Add debug logging
    console.log(`Found ${users.length} users with role ${role}`);
    console.log('Users:', users);

    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ 
      msg: "Server error", 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// 🔹 4️⃣ Monitor Attendance Records
router.get("/attendance", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    const records = await Attendance.find()
      .populate({
        path: 'studentId',
        select: 'name email',
        model: 'User'
      })
      .populate({
        path: 'courseId',
        select: 'name code',
        model: 'Course'
      })
      .populate({
        path: 'lecturerId',
        select: 'name email',
        model: 'User'
      })
      .select('date status checkInTime location courseId studentId lecturerId')
      .sort({ date: -1 });

    console.log('Found attendance records:', records.length); // Debug log
    res.json(records);
  } catch (err) {
    console.error('Attendance monitoring error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
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
    
    if (!user) {
      return res.status(404).json({ msg: "❌ User not found" });
    }

    res.json({ msg: `✅ ${user.role} removed successfully` });
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// 🔹 2️⃣ View All Courses
router.get("/courses", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('Fetching courses for dropdown');
    const courses = await Course.find({ isActive: true }) // Only get active courses
      .select('name code department')
      .populate('department', 'name')
      .sort({ name: 1 });
    
    console.log(`Found ${courses.length} courses`);
    console.log('Courses:', courses);

    res.json(courses);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ msg: "Server error", error: err.message });
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

// Reset Password (Admin Only)
router.post("/reset-password/:userId", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ msg: "❌ User not found" });
    }

    // Generate new temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update user's password
    user.password = hashedPassword;
    await user.save();

    res.json({
      msg: "✅ Password reset successfully",
      tempPassword,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// Get courses by program
router.get("/programs/:programId/courses", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const courses = await Course.find({
      'programs.program': req.params.programId
    })
    .populate('department', 'name code')
    .populate({
      path: 'programs',
      populate: [
        { path: 'program', select: 'name code' },
        { path: 'lecturer', select: 'name email' }
      ]
    });
    res.json(courses);
  } catch (err) {
    console.error('Error fetching program courses:', err);
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// Add course to program
router.post("/courses", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    console.log('Received course data:', req.body); // Debug log

    const {
      name,
      code,
      facultyId,
      departmentId,
      programId,
      description,
      credits,
      semester,
      academicYear,
      status
    } = req.body;

    // Validate required fields
    if (!name || !code || !facultyId || !departmentId || !programId || !credits || !semester || !academicYear) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    // Check if course already exists
    let existingCourse = await Course.findOne({ code: code.toUpperCase() });
    if (existingCourse) {
      return res.status(400).json({ msg: 'Course code already exists' });
    }

    // Validate references
    const [faculty, department, program] = await Promise.all([
      Faculty.findById(facultyId),
      Department.findById(departmentId),
      Program.findById(programId)
    ]);

    if (!faculty) return res.status(400).json({ msg: 'Faculty not found' });
    if (!department) return res.status(400).json({ msg: 'Department not found' });
    if (!program) return res.status(400).json({ msg: 'Program not found' });

    // Create new course
    const course = new Course({
      name: name.trim(),
      code: code.toUpperCase(),
      facultyId,
      departmentId,
      programId,
      description: description?.trim(),
      credits: Number(credits),
      semester,
      academicYear,
      status: status || 'active'
    });

    await course.save();

    // Populate references before sending response
    const populatedCourse = await Course.findById(course._id)
      .populate('facultyId', 'name code')
      .populate('departmentId', 'name code')
      .populate('programId', 'name code');

    console.log('Course created:', populatedCourse); // Debug log
    res.json(populatedCourse);
  } catch (err) {
    console.error('Create course error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ msg: err.message });
    }
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Get lecturers by department
router.get("/departments/:departmentId/lecturers", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const lecturers = await User.find({
      department: req.params.departmentId,
      role: 'lecturer'
    })
    .select('name email');
    res.json(lecturers);
  } catch (err) {
    console.error('Error fetching department lecturers:', err);
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// Get students for course assignment
router.get("/students", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }, 'name email');
    res.json(students);
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// Assign students to course
router.post("/courses/:courseId/students", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { studentIds } = req.body;
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ msg: "❌ Course not found" });
    }

    course.students = studentIds;
    await course.save();

    // Update students' courses array
    await User.updateMany(
      { _id: { $in: studentIds } },
      { $addToSet: { courses: req.params.courseId } }
    );

    // Remove course from students no longer in the course
    await User.updateMany(
      { _id: { $nin: studentIds },
      courses: req.params.courseId 
    },
    { $pull: { courses: req.params.courseId } }
    );

    res.json({ msg: "✅ Students assigned successfully" });
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// Get students in a course
router.get("/courses/:courseId/students", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).populate('students', 'name email');
    if (!course) {
      return res.status(404).json({ msg: "❌ Course not found" });
    }
    res.json(course.students);
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// Department Routes
router.get("/departments", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('facultyId', 'name code')
      .sort({ name: 1 });
    res.json(departments);
  } catch (err) {
    console.error('Get departments error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

router.post("/departments", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    const { name, code, facultyId, description } = req.body;

    // Validate required fields
    if (!name || !code || !facultyId) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    // Check if faculty exists
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(400).json({ msg: 'Faculty not found' });
    }

    // Check if department code already exists
    let existingDepartment = await Department.findOne({ code });
    if (existingDepartment) {
      return res.status(400).json({ msg: 'Department code already exists' });
    }

    // Create new department
    const department = new Department({
      name,
      code,
      facultyId,
      description
    });

    await department.save();

    // Populate faculty details before sending response
    const populatedDepartment = await Department.findById(department._id)
      .populate('facultyId', 'name code');

    res.json(populatedDepartment);

  } catch (err) {
    console.error('Create department error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Program Routes
router.get("/programs", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const programs = await Program.find()
      .populate('facultyId', 'name code')
      .populate('departmentId', 'name code')
      .sort({ name: 1 });
    res.json(programs);
  } catch (err) {
    console.error('Get programs error:', err);
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

router.post("/programs", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    const { 
      name, 
      code, 
      facultyId, 
      departmentId, 
      description, 
      duration, 
      totalCredits 
    } = req.body;

    // Check if program already exists
    let program = await Program.findOne({ 
      $or: [
        { name: name.trim() },
        { code: code.toUpperCase() }
      ]
    });

    if (program) {
      return res.status(400).json({ 
        msg: program.name === name.trim() 
          ? 'Program name already exists' 
          : 'Program code already exists' 
      });
    }

    // Check if faculty exists
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(400).json({ msg: 'Faculty not found' });
    }

    // Check if department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(400).json({ msg: 'Department not found' });
    }

    // Create new program
    program = new Program({
      name: name.trim(),
      code: code.toUpperCase(),
      facultyId,
      departmentId,
      description: description?.trim(),
      duration: Number(duration),
      totalCredits: Number(totalCredits)
    });

    await program.save();

    // Populate references before sending response
    const populatedProgram = await Program.findById(program._id)
      .populate('facultyId', 'name code')
      .populate('departmentId', 'name code');

    res.status(201).json({ 
      msg: "✅ Program added successfully", 
      program: populatedProgram 
    });
  } catch (err) {
    console.error('Create program error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ msg: err.message });
    }
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Get programs by department
router.get("/departments/:departmentId/programs", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const programs = await Program.find({ departmentId: req.params.departmentId })
      .populate('departmentId', 'name code');
    res.json(programs);
  } catch (err) {
    console.error('Error fetching department programs:', err);
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// Update program
router.put("/programs/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    const { name, code, departmentId, duration, description } = req.body;

    // Check if program exists with same code (excluding current program)
    const existingProgram = await Program.findOne({
      _id: { $ne: req.params.id },
      $or: [
        { code: { $regex: new RegExp(`^${code}$`, 'i') } },
        { 
          name: { $regex: new RegExp(`^${name}$`, 'i') },
          departmentId: departmentId 
        }
      ]
    });

    if (existingProgram) {
      return res.status(400).json({ 
        msg: "❌ Program with this code or name already exists in this department" 
      });
    }

    const program = await Program.findByIdAndUpdate(
      req.params.id,
      { name, code, departmentId, duration, description },
      { new: true, runValidators: true }
    ).populate('facultyId', 'name code');

    if (!program) {
      return res.status(404).json({ msg: "❌ Program not found" });
    }

    res.json({ 
      msg: "✅ Program updated successfully", 
      program 
    });
  } catch (err) {
    console.error('Error updating program:', err);
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// Delete program
router.delete("/programs/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Check if program has associated courses or students
    const courseCount = await Course.countDocuments({
      'programs.program': req.params.id
    });
    
    const studentCount = await User.countDocuments({
      program: req.params.id
    });

    if (courseCount > 0 || studentCount > 0) {
      return res.status(400).json({ 
        msg: "❌ Cannot delete program with associated courses or students" 
      });
    }

    const program = await Program.findByIdAndDelete(req.params.id);
    if (!program) {
      return res.status(404).json({ msg: "❌ Program not found" });
    }

    res.json({ msg: "✅ Program deleted successfully" });
  } catch (err) {
    console.error('Error deleting program:', err);
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// Get students by program
router.get("/programs/:programId/students", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const students = await User.find({
      program: req.params.programId,
      role: 'student'
    })
    .select('name email')
    .populate('program', 'name code')
    .populate('department', 'name code');
    
    res.json(students);
  } catch (err) {
    console.error('Error fetching program students:', err);
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// Enroll students in a course
router.post("/courses/:courseId/enroll", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { studentIds, programId } = req.body;
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ msg: "❌ Course not found" });
    }

    // Verify program exists in course
    const programExists = course.programs.some(p => 
      p.program.toString() === programId
    );
    
    if (!programExists) {
      return res.status(400).json({ 
        msg: "❌ This course is not offered for the selected program" 
      });
    }

    // Verify all students exist and belong to the program
    const students = await User.find({
      _id: { $in: studentIds },
      role: 'student',
      program: programId
    });

    if (students.length !== studentIds.length) {
      return res.status(400).json({ 
        msg: "❌ Some selected students are not valid or not in the specified program" 
      });
    }

    // Update course students
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.courseId,
      {
        $addToSet: {
          students: studentIds.map(studentId => ({
            student: studentId,
            program: programId
          }))
        }
      },
      { new: true }
    )
    .populate('department', 'name code')
    .populate({
      path: 'programs',
      populate: [
        { path: 'program', select: 'name code' },
        { path: 'lecturer', select: 'name email' }
      ]
    })
    .populate({
      path: 'students',
      populate: [
        { path: 'student', select: 'name email' },
        { path: 'program', select: 'name code' }
      ]
    });

    // Update students' courses array
    await User.updateMany(
      { _id: { $in: studentIds } },
      {
        $addToSet: {
          courses: {
            course: req.params.courseId,
            program: programId
          }
        }
      }
    );

    res.json({ 
      msg: "✅ Students enrolled successfully", 
      course: updatedCourse 
    });
  } catch (err) {
    console.error('Error enrolling students:', err);
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// Remove students from a course
router.post("/courses/:courseId/unenroll", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { studentIds, programId } = req.body;
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ msg: "❌ Course not found" });
    }

    // Remove students from course
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.courseId,
      {
        $pull: {
          students: {
            student: { $in: studentIds },
            program: programId
          }
        }
      },
      { new: true }
    )
    .populate('department', 'name code')
    .populate({
      path: 'programs',
      populate: [
        { path: 'program', select: 'name code' },
        { path: 'lecturer', select: 'name email' }
      ]
    })
    .populate({
      path: 'students',
      populate: [
        { path: 'student', select: 'name email' },
        { path: 'program', select: 'name code' }
      ]
    });

    // Remove course from students' courses array
    await User.updateMany(
      { _id: { $in: studentIds } },
      { $pull: { courses: req.params.courseId } }
    );

    res.json({ 
      msg: "✅ Students unenrolled successfully", 
      course: updatedCourse 
    });
  } catch (err) {
    console.error('Error unenrolling students:', err);
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// Get enrolled students in a course
router.get("/courses/:courseId/students", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId)
      .populate({
        path: 'students',
        populate: [
          { path: 'student', select: 'name email' },
          { path: 'program', select: 'name code' }
        ]
      });

    if (!course) {
      return res.status(404).json({ msg: "❌ Course not found" });
    }

    res.json(course.students);
  } catch (err) {
    console.error('Error fetching course students:', err);
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// Get all faculties
router.get("/faculties", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    const faculties = await Faculty.find()
      .populate({
        path: 'departments',
        select: 'name code'
      })
      .populate({
        path: 'programs',
        select: 'name code'
      })
      .populate({
        path: 'dean',
        select: 'name email'
      })
      .sort({ name: 1 });

    console.log('Faculties fetched:', faculties.length); // Debug log
    res.json(faculties);
  } catch (err) {
    console.error('Get faculties error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Get single faculty
router.get("/faculties/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id)
      .populate('departments', 'name code');
    
    if (!faculty) {
      return res.status(404).json({ msg: "Faculty not found" });
    }
    
    res.json(faculty);
  } catch (err) {
    console.error('Error fetching faculty:', err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// Create faculty
router.post("/faculties", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    const { name, code, description, deanId } = req.body;

    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    // Check if faculty code already exists
    let existingFaculty = await Faculty.findOne({ 
      $or: [
        { code: code.toUpperCase() },
        { name: name.trim() }
      ]
    });
    
    if (existingFaculty) {
      return res.status(400).json({ 
        msg: existingFaculty.code === code.toUpperCase() 
          ? 'Faculty code already exists' 
          : 'Faculty name already exists'
      });
    }

    // Check if dean exists if provided
    if (deanId) {
      const dean = await User.findOne({ 
        _id: deanId,
        role: 'lecturer' // Ensure the user is a lecturer
      });
      if (!dean) {
        return res.status(400).json({ msg: 'Invalid dean selected' });
      }
    }

    // Create new faculty
    const faculty = new Faculty({
      name: name.trim(),
      code: code.toUpperCase(),
      description: description?.trim(),
      dean: deanId,
      departments: [],
      programs: []
    });

    await faculty.save();

    // Populate references before sending response
    const populatedFaculty = await Faculty.findById(faculty._id)
      .populate({
        path: 'departments',
        select: 'name code'
      })
      .populate({
        path: 'programs',
        select: 'name code'
      })
      .populate({
        path: 'dean',
        select: 'name email'
      });

    res.json(populatedFaculty);
  } catch (err) {
    console.error('Create faculty error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ msg: 'Invalid faculty data' });
    }
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Update faculty
router.put("/faculties/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    const { name, code, description, deanId } = req.body;
    
    // Check if faculty exists
    let faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ msg: 'Faculty not found' });
    }

    // Check if new code already exists (if code is being changed)
    if (code && code !== faculty.code) {
      const existingFaculty = await Faculty.findOne({ 
        code: code.toUpperCase(),
        _id: { $ne: req.params.id }
      });
      if (existingFaculty) {
        return res.status(400).json({ msg: 'Faculty code already exists' });
      }
    }

    // Check if dean exists if provided
    if (deanId) {
      const dean = await User.findOne({ 
        _id: deanId,
        role: 'lecturer'
      });
      if (!dean) {
        return res.status(400).json({ msg: 'Invalid dean selected' });
      }
    }

    // Update faculty
    faculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      {
        name: name?.trim(),
        code: code?.toUpperCase(),
        description: description?.trim(),
        dean: deanId,
        updatedAt: Date.now()
      },
      { 
        new: true,
        runValidators: true 
      }
    )
    .populate({
      path: 'departments',
      select: 'name code'
    })
    .populate({
      path: 'programs',
      select: 'name code'
    })
    .populate({
      path: 'dean',
      select: 'name email'
    });

    res.json(faculty);
  } catch (err) {
    console.error('Update faculty error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ msg: 'Invalid faculty data' });
    }
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Delete faculty
router.delete("/faculties/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Check if faculty has departments
    const departmentCount = await Department.countDocuments({ 
      faculty: req.params.id 
    });

    if (departmentCount > 0) {
      return res.status(400).json({ 
        msg: "Cannot delete faculty with existing departments" 
      });
    }

    const faculty = await Faculty.findByIdAndDelete(req.params.id);
    
    if (!faculty) {
      return res.status(404).json({ msg: "Faculty not found" });
    }

    res.json({ msg: "Faculty deleted successfully" });
  } catch (err) {
    console.error('Error deleting faculty:', err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// @route   GET api/admin/sessions
// @desc    Get all sessions
// @access  Private (Admin only)
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    const sessions = await Session.find()
      .populate({
        path: 'lecturerId',
        select: 'name email',
        model: 'User'
      })
      .populate({
        path: 'courseId',
        select: 'name code',
        model: 'Course'
      })
      .sort({ createdAt: -1 });

    if (!sessions) {
      return res.status(404).json({ msg: 'No sessions found' });
    }

    res.json(sessions);
  } catch (err) {
    console.error('Admin sessions error:', err);
    res.status(500).json({ 
      msg: 'Server Error',
      error: err.message 
    });
  }
});

// @route   GET api/admin/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/dashboard-stats
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard-stats', authMiddleware, async (req, res) => {
  console.log('Dashboard stats route hit');
  try {
    // For testing, return mock data first
    res.json({
      totalUsers: 10,
      totalCourses: 5,
      activeAttendance: 2
    });

    // Once mock data works, uncomment this for real data
    /*
    const [totalUsers, totalCourses, activeAttendance] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Session.countDocuments({ status: 'active' })
    ]);

    res.json({
      totalUsers,
      totalCourses,
      activeAttendance
    });
    */
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Test route to verify admin routes are working
router.get('/test', (req, res) => {
  console.log('Admin test route hit');
  res.json({ msg: 'Admin routes working' });
});

// @route   PUT api/admin/departments/:id
// @desc    Update a department
// @access  Private (Admin only)
router.put('/departments/:id', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: 'Invalid department ID' });
    }

    const { name, code, facultyId, description } = req.body;

    // Validate required fields
    if (!name || !code || !facultyId) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    // Check if department exists
    let department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ msg: 'Department not found' });
    }

    // Check if faculty exists
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(400).json({ msg: 'Faculty not found' });
    }

    // Check if new code already exists (if code is being changed)
    if (code !== department.code) {
      const existingDepartment = await Department.findOne({ 
        code, 
        _id: { $ne: req.params.id } 
      });
      if (existingDepartment) {
        return res.status(400).json({ msg: 'Department code already exists' });
      }
    }

    // Update department
    department = await Department.findByIdAndUpdate(
      req.params.id,
      {
        name,
        code,
        facultyId,
        description,
        updatedAt: Date.now()
      },
      { 
        new: true,
        runValidators: true
      }
    ).populate('facultyId', 'name code');

    // Log the update
    console.log('Department updated:', department);

    res.json(department);

  } catch (err) {
    console.error('Update department error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ msg: 'Invalid department data' });
    }
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/admin/departments/:id
// @desc    Get a single department
// @access  Private (Admin only)
router.get('/departments/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: 'Invalid department ID' });
    }

    const department = await Department.findById(req.params.id)
      .populate('facultyId', 'name code');

    if (!department) {
      return res.status(404).json({ msg: 'Department not found' });
    }

    res.json(department);
  } catch (err) {
    console.error('Get department error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/admin/courses
// @desc    Get all courses
// @access  Private (Admin only)
router.get('/courses', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    const courses = await Course.find()
      .populate('facultyId', 'name code')
      .populate('departmentId', 'name code')
      .populate('programId', 'name code')
      .sort({ createdAt: -1 });

    res.json(courses);
  } catch (err) {
    console.error('Get courses error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   POST api/admin/courses
// @desc    Create a new course
// @access  Private (Admin only)
router.post('/courses', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    console.log('Received course data:', req.body); // Debug log

    const {
      name,
      code,
      facultyId,
      departmentId,
      programId,
      description,
      credits,
      status
    } = req.body;

    // Validate required fields
    if (!name || !code || !facultyId || !departmentId || !programId || !credits) {
      console.log('Missing fields:', { name, code, facultyId, departmentId, programId, credits });
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    // Create course
    const course = new Course({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      facultyId,
      departmentId,
      programId,
      description: description?.trim() || '',
      credits: Number(credits),
      status: status || 'active'
    });

    // Save course
    await course.save();

    // Populate references
    await course.populate([
      { path: 'facultyId', select: 'name code' },
      { path: 'departmentId', select: 'name code' },
      { path: 'programId', select: 'name code' }
    ]);

    res.json(course);
  } catch (err) {
    console.error('Create course error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ msg: err.message });
    }
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/admin/programs
// @desc    Get all programs
// @access  Private (Admin only)
router.get('/programs', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    const programs = await Program.find()
      .populate('facultyId', 'name code')
      .populate('departmentId', 'name code')
      .sort({ name: 1 });

    res.json(programs);
  } catch (err) {
    console.error('Get programs error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   POST api/admin/programs
// @desc    Create a new program
// @access  Private (Admin only)
router.post('/programs', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    const { 
      name, 
      code, 
      facultyId, 
      departmentId, 
      description, 
      duration, 
      totalCredits 
    } = req.body;

    // Validate required fields
    if (!name || !code || !departmentId || !duration) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    // Check if department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(400).json({ msg: 'Department not found' });
    }

    // Check if program code already exists
    let existingProgram = await Program.findOne({ code });
    if (existingProgram) {
      return res.status(400).json({ msg: 'Program code already exists' });
    }

    // Create new program
    program = new Program({
      name,
      code,
      facultyId,
      departmentId,
      description: description?.trim(),
      duration: Number(duration),
      totalCredits: Number(totalCredits)
    });

    await program.save();

    // Populate department details before sending response
    const populatedProgram = await Program.findById(program._id)
      .populate('facultyId', 'name code')
      .populate('departmentId', 'name code');

    res.status(201).json({ 
      msg: "✅ Program added successfully", 
      program: populatedProgram 
    });
  } catch (err) {
    console.error('Error creating program:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Program Routes
router.get('/programs/statistics', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    const programs = await Program.find()
      .populate('facultyId', 'name')
      .populate('departmentId', 'name')
      .select('name code statistics');

    const statistics = {
      totalPrograms: programs.length,
      totalStudents: programs.reduce((sum, prog) => sum + prog.statistics.totalStudents, 0),
      totalLecturers: programs.reduce((sum, prog) => sum + prog.statistics.totalLecturers, 0),
      totalCourses: programs.reduce((sum, prog) => sum + prog.statistics.totalCourses, 0),
      averageGraduationRate: programs.reduce((sum, prog) => sum + prog.statistics.graduationRate, 0) / programs.length,
      programStats: programs.map(prog => ({
        name: prog.name,
        code: prog.code,
        faculty: prog.facultyId.name,
        department: prog.departmentId.name,
        ...prog.statistics
      }))
    };

    res.json(statistics);
  } catch (err) {
    console.error('Get program statistics error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Assign courses to program
router.post('/programs/:id/courses', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    const { courseIds } = req.body;
    const program = await Program.findById(req.params.id);

    if (!program) {
      return res.status(404).json({ msg: 'Program not found' });
    }

    // Validate courses
    const courses = await Course.find({ _id: { $in: courseIds } });
    if (courses.length !== courseIds.length) {
      return res.status(400).json({ msg: 'One or more courses not found' });
    }

    program.courses = courseIds;
    await program.save();
    await program.calculateStatistics();

    const updatedProgram = await Program.findById(req.params.id)
      .populate('courses')
      .populate('facultyId', 'name')
      .populate('departmentId', 'name');

    res.json(updatedProgram);
  } catch (err) {
    console.error('Assign courses error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Assign lecturers to program
router.post('/programs/:id/lecturers', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    const { lecturerIds } = req.body;
    const program = await Program.findById(req.params.id);

    if (!program) {
      return res.status(404).json({ msg: 'Program not found' });
    }

    // Validate lecturers
    const lecturers = await User.find({ 
      _id: { $in: lecturerIds },
      role: 'lecturer'
    });
    
    if (lecturers.length !== lecturerIds.length) {
      return res.status(400).json({ msg: 'One or more lecturers not found or invalid' });
    }

    program.lecturers = lecturerIds;
    await program.save();
    await program.calculateStatistics();

    const updatedProgram = await Program.findById(req.params.id)
      .populate('lecturers', 'name email')
      .populate('facultyId', 'name')
      .populate('departmentId', 'name');

    res.json(updatedProgram);
  } catch (err) {
    console.error('Assign lecturers error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Enroll students in program
router.post('/programs/:id/students', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    const { studentIds } = req.body;
    const program = await Program.findById(req.params.id);

    if (!program) {
      return res.status(404).json({ msg: 'Program not found' });
    }

    // Validate students
    const students = await User.find({ 
      _id: { $in: studentIds },
      role: 'student'
    });
    
    if (students.length !== studentIds.length) {
      return res.status(400).json({ msg: 'One or more students not found or invalid' });
    }

    program.students = studentIds;
    await program.save();
    await program.calculateStatistics();

    const updatedProgram = await Program.findById(req.params.id)
      .populate('students', 'name email')
      .populate('facultyId', 'name')
      .populate('departmentId', 'name');

    res.json(updatedProgram);
  } catch (err) {
    console.error('Enroll students error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Get program details with all relationships
router.get('/programs/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    const program = await Program.findById(req.params.id)
      .populate('facultyId', 'name code')
      .populate('departmentId', 'name code')
      .populate('courses', 'name code credits')
      .populate('lecturers', 'name email')
      .populate('students', 'name email');

    if (!program) {
      return res.status(404).json({ msg: 'Program not found' });
    }

    res.json(program);
  } catch (err) {
    console.error('Get program details error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Update program statistics
router.post('/programs/:id/update-statistics', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    const program = await Program.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ msg: 'Program not found' });
    }

    await program.calculateStatistics();
    res.json(program);
  } catch (err) {
    console.error('Update statistics error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Update the attendance monitoring route
router.get("/attendance-monitoring", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    const records = await Attendance.find()
      .populate('studentId', 'name email')
      .populate('courseId', 'name code')
      .populate('lecturerId', 'name email')
      .sort({ date: -1 });

    res.json(records);
  } catch (err) {
    console.error('Attendance monitoring error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Reports routes with better error handling and authentication verification
router.get("/reports/attendance-trends", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Log the request for debugging
    console.log('Fetching attendance trends, user:', req.user);

    if (!req.user || req.user.role !== 'admin') {
      console.log('Unauthorized access attempt');
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Log query parameters
    console.log('Querying attendance from:', thirtyDaysAgo);

    const attendanceData = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            status: "$status"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          statuses: {
            $push: {
              status: "$_id.status",
              count: "$count"
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Log the raw data
    console.log('Raw attendance data:', attendanceData);

    const processedData = attendanceData.map(day => ({
      date: day._id,
      present: day.statuses.find(s => s.status === 'present')?.count || 0,
      absent: day.statuses.find(s => s.status === 'absent')?.count || 0,
      late: day.statuses.find(s => s.status === 'late')?.count || 0
    }));

    // Log the processed data
    console.log('Processed data:', processedData);

    // Set explicit headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    return res.json(processedData);

  } catch (err) {
    console.error('Attendance trends error:', err);
    // Send error as JSON with detailed information
    return res.status(500).json({ 
      msg: 'Server Error', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// Course stats route with similar improvements
router.get("/reports/course-stats", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('Fetching course stats, user:', req.user);

    if (!req.user || req.user.role !== 'admin') {
      console.log('Unauthorized access attempt');
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    const courseStats = await Attendance.aggregate([
      {
        $match: {
          courseId: { $ne: null }
        }
      },
      {
        $group: {
          _id: "$courseId",
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] }
          },
          late: {
            $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "course"
        }
      },
      {
        $unwind: "$course"
      },
      {
        $project: {
          courseName: "$course.name",
          courseCode: "$course.code",
          total: 1,
          present: 1,
          absent: 1,
          late: 1,
          attendanceRate: {
            $multiply: [
              { $divide: ["$present", { $max: ["$total", 1] }] },
              100
            ]
          }
        }
      },
      {
        $sort: { attendanceRate: -1 }
      }
    ]);

    // Log the results
    console.log('Course stats results:', courseStats);

    // Set explicit headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    return res.json(courseStats);

  } catch (err) {
    console.error('Course stats error:', err);
    return res.status(500).json({ 
      msg: 'Server Error', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// Generate sample attendance data
router.post("/generate-sample-data", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('Generating sample attendance data...');
    const count = await Attendance.generateSampleData();
    console.log(`Generated ${count} sample attendance records`);
    res.json({ 
      msg: "Sample data generated successfully", 
      count 
    });
  } catch (err) {
    console.error('Error generating sample data:', err);
    res.status(500).json({ 
      msg: "Failed to generate sample data", 
      error: err.message 
    });
  }
});

module.exports = router;
