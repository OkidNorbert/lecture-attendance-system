const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { protect } = require("../middleware/auth");
const { User, Student, Lecturer } = require("../models/User");
const Course = require("../models/Course");
const Attendance = require("../models/Attendance");
const Session = require("../models/Session");
const { sendTempPassword, sendWelcomeEmail } = require('../utils/emailService');
const Department = require("../models/Department");
const Program = require("../models/Program");
const Faculty = require('../models/Faculty');
const adminMiddleware = require('../middleware/admin');
const mongoose = require('mongoose');
const Enrollment = require("../models/Enrollment");

const router = express.Router();

// 🔹 1️⃣ Register a Lecturer
router.post("/register-lecturer", protect, adminMiddleware, async (req, res) => {
  try {
    const { first_name, last_name, email, department, role } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "❌ User already exists" });
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Generate a lecturer ID
    const lecturerId = `LEC${Date.now().toString().slice(-6)}`;

    user = new Lecturer({
      first_name,
      last_name,
      email,
      password_hash: hashedPassword,
      role,
      department,
      isApproved: true,
      lecturer_id: lecturerId
    });

    await user.save();

    // Send welcome email with credentials
    try {
      await sendWelcomeEmail(email, tempPassword, `${first_name} ${last_name}`, role);
      res.status(201).json({
        msg: "✅ User registered successfully. Login credentials sent to their email.",
        tempPassword,
        user: {
          id: user._id,
          first_name: user.first_name,
          last_name: user.last_name,
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
          first_name: user.first_name,
          last_name: user.last_name,
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
router.post("/assign-course", protect, adminMiddleware, async (req, res) => {
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
router.get("/users", protect, adminMiddleware, async (req, res) => {
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
      .select('first_name last_name email role department')
      .populate('department', 'name')
      .sort({ first_name: 1, last_name: 1 });

    // Process user data for client display
    const formattedUsers = users.map(user => ({
      id: user._id,
      name: `${user.first_name} ${user.last_name}`,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      department: user.department ? user.department.name : null
    }));

    // Add debug logging
    console.log(`Found ${users.length} users with role ${role}`);
    
    res.json(formattedUsers);
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
router.get("/attendance", protect, async (req, res) => {
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
router.get("/active-sessions", protect, adminMiddleware, async (req, res) => {
  try {
    const activeSessions = await Session.find({ expiryTime: { $gt: Date.now() } });
    res.json(activeSessions);
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// 🔹 6️⃣ Approve Lecturer Registration
router.put("/approve-lecturer/:id", protect, adminMiddleware, async (req, res) => {
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
router.post("/reset-password/:id", protect, adminMiddleware, async (req, res) => {
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
router.get("/attendance-report", protect, adminMiddleware, async (req, res) => {
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
router.post("/register-admin", protect, adminMiddleware, async (req, res) => {
  try {
    if (!req.user.isSuperAdmin) {
      return res.status(403).json({ msg: "❌ Only super admins can register new admins" });
    }

    const { first_name, last_name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "❌ Admin already exists" });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ 
      first_name, 
      last_name, 
      email, 
      password_hash: hashedPassword, 
      role: "admin",
      isApproved: true
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
router.delete("/remove-user/:id", protect, adminMiddleware, async (req, res) => {
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
router.get("/courses", protect, adminMiddleware, async (req, res) => {
  try {
    console.log('Fetching courses for dropdown');
    const courses = await Course.find({ status: 'active' }) // Fixed filter to use status instead of isActive
      .select('course_name course_code program_id credits semester academicYear status description')
      .populate('program_id', 'name code')
      .sort({ course_name: 1 });
    
    console.log(`Found ${courses.length} courses`);
    console.log('Courses:', courses);

    // Transform the data to match the expected client format
    const formattedCourses = courses.map(course => ({
      _id: course._id,
      name: course.course_name,
      code: course.course_code,
      programId: course.program_id?._id,
      credits: course.credits,
      semester: course.semester,
      academicYear: course.academicYear,
      status: course.status,
      description: course.description,
      // Add populated program data if available
      programId: course.program_id
    }));

    res.json(formattedCourses);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// 🔹 3️⃣ Remove a Course
router.delete("/remove-course/:id", protect, adminMiddleware, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ msg: "❌ Course not found" });

    res.json({ msg: "✅ Course removed successfully" });
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// 🔹 4️⃣ Generate Lecturer Performance Report
router.get("/lecturer-performance/:id", protect, adminMiddleware, async (req, res) => {
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
router.get("/student-attendance-trends", protect, adminMiddleware, async (req, res) => {
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
router.post("/reset-password/:userId", protect, adminMiddleware, async (req, res) => {
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
router.get("/programs/:programId/courses", protect, adminMiddleware, async (req, res) => {
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
router.post("/courses", protect, adminMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    console.log('Received course data:', req.body);

    const {
      name,
      code,
      programId,
      description,
      credits,
      semester,
      programYear,
      status
    } = req.body;

    // Validate required fields
    if (!name || !code || !programId || !credits || !semester || !programYear) {
      return res.status(400).json({ 
        msg: 'Please provide all required fields',
        errors: {
          name: !name ? 'Course name is required' : undefined,
          code: !code || code.trim() === '' ? 'Course code is required' : undefined,
          programId: !programId ? 'Program is required' : undefined,
          credits: !credits ? 'Credits are required' : undefined,
          semester: !semester ? 'Semester is required' : undefined,
          programYear: !programYear ? 'Program Year is required' : undefined
        }
      });
    }

    // Validate course code
    const courseCode = code ? code.trim().toUpperCase() : '';
    if (!courseCode) {
      return res.status(400).json({ 
        msg: 'Course code cannot be empty',
        errors: {
          code: 'Course code is required'
        }
      });
    }

    // Check if course code already exists
    const existingCourse = await Course.findOne({ 
      course_code: courseCode,
      program_id: programId 
    });
    if (existingCourse) {
      return res.status(400).json({ 
        msg: 'Course code already exists in this program',
        errors: {
          code: 'This course code is already in use for this program'
        }
      });
    }

    // Check if program exists
    const program = await Program.findById(programId);
    if (!program) {
      return res.status(400).json({ msg: 'Program not found' });
    }

    // Create course
    const course = new Course({
      course_name: name.trim(),
      course_code: courseCode,
      program_id: programId,
      description: description?.trim() || '',
      credits: Number(credits),
      semester,
      programYear: Number(programYear),
      academicYear: req.body.academic_year || req.body.academicYear,
      status: status || 'active'
    });

    // Save course
    await course.save();

    // Populate references
    await course.populate('program_id', 'name code');

    // Create a formatted response that matches client expectations
    const formattedCourse = {
      id: course._id,
      name: course.course_name,
      code: course.course_code,
      program: course.program_id ? {
        id: course.program_id._id,
        name: course.program_id.name,
        code: course.program_id.code
      } : null,
      description: course.description,
      credits: course.credits,
      semester: course.semester,
      programYear: course.programYear,
      status: course.status
    };

    res.json(formattedCourse);
  } catch (err) {
    console.error('Error creating course:', err);
    if (err.code === 11000) { // MongoDB duplicate key error
      return res.status(400).json({ 
        msg: 'Course code already exists',
        errors: {
          code: 'This course code is already in use'
        }
      });
    }
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Get lecturers by department
router.get("/departments/:departmentId/lecturers", protect, adminMiddleware, async (req, res) => {
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
router.get("/students", protect, adminMiddleware, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }, 'name email');
    res.json(students);
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// Assign students to course
router.post("/courses/:courseId/students", protect, adminMiddleware, async (req, res) => {
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
router.get("/courses/:courseId/students", protect, adminMiddleware, async (req, res) => {
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
router.get("/departments", protect, adminMiddleware, async (req, res) => {
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

router.post("/departments", protect, adminMiddleware, async (req, res) => {
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
router.get("/programs", protect, adminMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    console.log('Fetching programs for admin');
    
    const programs = await Program.find()
      .populate('facultyId', 'name code')
      .populate('departmentId', 'name code')
      .sort({ name: 1 });

    // Make sure data is consistent
    const formattedPrograms = programs.map(program => ({
      _id: program._id,
      id: program._id,
      name: program.name,
      code: program.code,
      facultyId: program.facultyId,
      departmentId: program.departmentId,
      faculty: program.facultyId,
      department: program.departmentId,
      description: program.description,
      duration: program.duration,
      totalCredits: program.totalCredits
    }));

    console.log(`Found ${programs.length} programs`);
    res.json(formattedPrograms);
  } catch (err) {
    console.error('Get programs error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

router.post("/programs", protect, adminMiddleware, async (req, res) => {
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
    console.error('Create program error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Get programs by department
router.get("/departments/:departmentId/programs", protect, adminMiddleware, async (req, res) => {
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
router.put("/programs/:id", protect, adminMiddleware, async (req, res) => {
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
router.delete("/programs/:id", protect, adminMiddleware, async (req, res) => {
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
router.get("/programs/:programId/students", protect, adminMiddleware, async (req, res) => {
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
router.post("/courses/:courseId/enroll", protect, adminMiddleware, async (req, res) => {
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
router.post("/courses/:courseId/unenroll", protect, adminMiddleware, async (req, res) => {
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
router.get("/courses/:courseId/students", protect, adminMiddleware, async (req, res) => {
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
router.get("/faculties", protect, adminMiddleware, async (req, res) => {
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
router.get("/faculties/:id", protect, adminMiddleware, async (req, res) => {
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
router.post("/faculties", protect, adminMiddleware, async (req, res) => {
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
router.put("/faculties/:id", protect, adminMiddleware, async (req, res) => {
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
router.delete("/faculties/:id", protect, adminMiddleware, async (req, res) => {
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
router.get('/sessions', protect, async (req, res) => {
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
router.get('/users', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    const users = await User.find()
      .select('first_name last_name email role isApproved department')
      .populate('department', 'name')
      .sort({ first_name: 1, last_name: 1 });

    // Return consistent user structure
    const formattedUsers = users.map(user => ({
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      department: user.department ? user.department.name : null
    }));

    res.json(formattedUsers);
  } catch (err) {
    console.error('Error fetching all users:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/admin/dashboard-stats
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard-stats', protect, async (req, res) => {
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
router.put('/departments/:id', protect, async (req, res) => {
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
router.get('/departments/:id', protect, async (req, res) => {
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
router.get('/courses', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    console.log('Fetching courses for admin');
    
    const courses = await Course.find()
      .populate('program_id', 'name code')
      .sort({ createdAt: -1 });

    // Format response for client
    const formattedCourses = courses.map(course => ({
      id: course._id,
      name: course.course_name,
      code: course.course_code,
      program: course.program_id ? {
        id: course.program_id._id,
        name: course.program_id.name,
        code: course.program_id.code
      } : null,
      description: course.description,
      credits: course.credits,
      semester: course.semester,
      academicYear: course.academicYear,
      status: course.status
    }));

    res.json(formattedCourses);
  } catch (err) {
    console.error('Get courses error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   POST api/admin/courses
// @desc    Create a new course
// @access  Private (Admin only)
router.post('/courses', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    console.log('Received course data:', req.body);

    const {
      name,
      code,
      programId,
      description,
      credits,
      semester,
      programYear,
      status
    } = req.body;

    console.log('Raw programYear received:', programYear, typeof programYear);

    // Validate required fields
    if (!name || !code || !programId || !credits || !semester || programYear === undefined) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    // Validate course code
    const courseCode = code ? code.trim().toUpperCase() : '';
    if (!courseCode) {
      return res.status(400).json({ 
        msg: 'Course code cannot be empty',
        errors: {
          code: 'Course code is required'
        }
      });
    }

    // Check if course code already exists
    const existingCourse = await Course.findOne({ 
      course_code: courseCode,
      program_id: programId 
    });
    if (existingCourse) {
      return res.status(400).json({ 
        msg: 'Course code already exists in this program',
        errors: {
          code: 'This course code is already in use for this program'
        }
      });
    }

    // Check if program exists
    const program = await Program.findById(programId);
    if (!program) {
      return res.status(400).json({ msg: 'Program not found' });
    }

    // Create course
    const course = new Course({
      course_name: name.trim(),
      course_code: courseCode,
      program_id: programId,
      description: description?.trim() || '',
      credits: Number(credits),
      semester,
      programYear: Number(programYear),
      academicYear: req.body.academic_year || req.body.academicYear,
      status: status || 'active'
    });

    // Save course
    await course.save();

    // Populate references
    await course.populate('program_id', 'name code');

    // Create a formatted response that matches client expectations
    const formattedCourse = {
      id: course._id,
      name: course.course_name,
      code: course.course_code,
      program: course.program_id ? {
        id: course.program_id._id,
        name: course.program_id.name,
        code: course.program_id.code
      } : null,
      description: course.description,
      credits: course.credits,
      semester: course.semester,
      programYear: course.programYear,
      status: course.status
    };

    res.json(formattedCourse);
  } catch (err) {
    console.error('Error creating course:', err);
    if (err.code === 11000) { // MongoDB duplicate key error
      return res.status(400).json({ 
        msg: 'Course code already exists',
        errors: {
          code: 'This course code is already in use'
        }
      });
    }
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/admin/programs
// @desc    Get all programs
// @access  Private (Admin only)
router.get('/programs', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    console.log('Fetching programs for admin');
    
    const programs = await Program.find()
      .populate('facultyId', 'name code')
      .populate('departmentId', 'name code')
      .sort({ name: 1 });

    // Make sure data is consistent
    const formattedPrograms = programs.map(program => ({
      _id: program._id,
      id: program._id,
      name: program.name,
      code: program.code,
      facultyId: program.facultyId,
      departmentId: program.departmentId,
      faculty: program.facultyId,
      department: program.departmentId,
      description: program.description,
      duration: program.duration,
      totalCredits: program.totalCredits
    }));

    console.log(`Found ${programs.length} programs`);
    res.json(formattedPrograms);
  } catch (err) {
    console.error('Get programs error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   POST api/admin/programs
// @desc    Create a new program
// @access  Private (Admin only)
router.post('/programs', protect, async (req, res) => {
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
    console.error('Create program error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Program Routes
router.get('/programs/statistics', protect, async (req, res) => {
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
router.post('/programs/:id/courses', protect, async (req, res) => {
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
router.post('/programs/:id/lecturers', protect, async (req, res) => {
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
router.post('/programs/:id/students', protect, async (req, res) => {
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
router.get('/programs/:id', protect, async (req, res) => {
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
router.post('/programs/:id/update-statistics', protect, async (req, res) => {
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
router.get("/attendance-monitoring", protect, async (req, res) => {
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
router.get("/reports/attendance-trends", protect, adminMiddleware, async (req, res) => {
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
router.get("/reports/course-stats", protect, adminMiddleware, async (req, res) => {
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
router.post("/generate-sample-data", protect, adminMiddleware, async (req, res) => {
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

// Update a course
router.put("/courses/:id", protect, adminMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    console.log('Updating course:', req.params.id);
    console.log('Update data:', req.body);

    const {
      course_name,
      course_code,
      program_id,
      description,
      credits,
      semester,
      programYear,
      status,
      lecturers,
      faculty,
      department
    } = req.body;

    console.log('Raw programYear received:', programYear, typeof programYear);

    // Validate required fields
    if (!course_name || !course_code || !program_id || !credits || !semester || programYear === undefined) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    // Check if the course exists
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    // Check if new code already exists (excluding this course)
    if (course_code !== course.course_code) {
      const existingCourse = await Course.findOne({
        course_code: course_code.toUpperCase(),
        _id: { $ne: req.params.id }
      });
      
      if (existingCourse) {
        return res.status(400).json({ msg: 'Course code already exists' });
      }
    }

    // Validate program reference
    const program = await Program.findById(program_id);
    if (!program) {
      return res.status(400).json({ msg: 'Program not found' });
    }

    // Update the course with faculty and department if provided
    const updateData = {
      course_name,
      course_code,
      program_id,
      description,
      credits,
      semester,
      programYear,
      status,
      lecturers
    };
    
    console.log('Updating course with data:', updateData);
    console.log('Program Year received:', programYear);
    console.log('Academic Year received:', req.body.academic_year || req.body.academicYear);
    
    // Get program to fetch faculty and department info
    const programDetails = await Program.findById(program_id)
      .populate('facultyId', 'name code')
      .populate('departmentId', 'name code');
      
    // If faculty and department were explicitly provided, store them
    if (faculty) {
      updateData.faculty = faculty;
    } else if (programDetails?.facultyId) {
      updateData.faculty = programDetails.facultyId._id;
    }
    
    if (department) {
      updateData.department = department;
    } else if (programDetails?.departmentId) {
      updateData.department = programDetails.departmentId._id;
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    // Get full course details with populated relationships
    const fullCourseDetails = await updatedCourse.getFullDetails();

    // Add additional data needed by the client
    const enrichedCourseDetails = {
      ...fullCourseDetails,
      faculty: programDetails?.facultyId || updateData.faculty || null,
      department: programDetails?.departmentId || updateData.department || null,
      facultyId: programDetails?.facultyId || updateData.faculty || null,
      departmentId: programDetails?.departmentId || updateData.department || null,
      programYear: updateData.programYear,
      program: {
        id: programDetails?._id,
        name: programDetails?.name,
        code: programDetails?.code
      }
    };
    
    console.log('Enriched course details:', enrichedCourseDetails);

    res.json({
      msg: 'Course updated successfully',
      course: enrichedCourseDetails
    });
  } catch (err) {
    console.error('Error updating course:', err);
    res.status(500).json({ 
      msg: 'Server error', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Update user details (Name, Email, Role)
router.put("/users/:id", protect, adminMiddleware, async (req, res) => {
  try {
    console.log('Updating user:', req.params.id);
    console.log('Update data:', req.body);

    const { first_name, last_name, email, role, password } = req.body;

    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: "❌ User not found" });
    }

    // Check if email is being changed and if it's already in use
    if (email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json({ msg: "❌ Email already in use by another user" });
      }
    }

    // Update basic user information
    user.first_name = first_name;
    user.last_name = last_name;
    user.email = email;
    user.role = role;

    // Update password if provided
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password_hash = hashedPassword;
    }

    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(req.params.id).select('-password_hash');

    console.log('User updated:', updatedUser);
    res.json(updatedUser);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// Get active attendance sessions
router.get('/active-sessions', protect, adminMiddleware, async (req, res) => {
    try {
        const activeSessions = await Session.find({ expiryTime: { $gt: Date.now() } });
        
        res.json({ sessions: activeSessions });
    } catch (error) {
        res.status(500).json({ message: "Error fetching active sessions", error: error.message });
    }
});

// Get attendance analytics data
router.get('/attendance-analytics', protect, adminMiddleware, async (req, res) => {
    try {
        const { timeframe = 'week', course = 'all' } = req.query;
        
        // Set date range based on timeframe
        const now = new Date();
        let startDate = new Date();
        
        switch(timeframe) {
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'semester':
                startDate.setMonth(now.getMonth() - 4);
                break;
            default:
                startDate.setDate(now.getDate() - 7);
        }
        
        // Build query
        let query = {
            createdAt: { $gte: startDate, $lte: now }
        };
        
        // Add course filter if not 'all'
        if (course !== 'all') {
            query.courseId = course;
        }
        
        // Get attendance sessions in the date range
        const sessions = await Session.find(query)
            .populate('courseId', 'name code')
            .lean();
            
        // Get attendance records for those sessions
        const sessionIds = sessions.map(session => session._id);
        const attendanceRecords = await Attendance.find({
            sessionId: { $in: sessionIds }
        }).lean();
        
        // Calculate daily attendance
        const dailyAttendance = [];
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dailyCounts = {};
        
        // Initialize with zeros
        daysOfWeek.forEach(day => {
            dailyCounts[day] = 0;
        });
        
        // Count attendance by day
        sessions.forEach(session => {
            const day = daysOfWeek[new Date(session.createdAt).getDay()];
            const attendeesCount = attendanceRecords.filter(
                record => record.sessionId.toString() === session._id.toString()
            ).length;
            
            dailyCounts[day] += attendeesCount;
        });
        
        // Format for chart
        for (const [day, count] of Object.entries(dailyCounts)) {
            dailyAttendance.push({ date: day, count });
        }
        
        // Sort by day of week
        dailyAttendance.sort((a, b) => {
            return daysOfWeek.indexOf(a.date) - daysOfWeek.indexOf(b.date);
        });
        
        // Calculate course distribution
        const courseDistribution = [];
        const courseCounts = {};
        
        // Count attendance by course
        attendanceRecords.forEach(record => {
            const session = sessions.find(s => s._id.toString() === record.sessionId.toString());
            if (session && session.courseId) {
                const courseName = session.courseId.name;
                courseCounts[courseName] = (courseCounts[courseName] || 0) + 1;
            }
        });
        
        // Format for chart
        for (const [name, value] of Object.entries(courseCounts)) {
            courseDistribution.push({ name, value });
        }
        
        // Sort by count descending
        courseDistribution.sort((a, b) => b.value - a.value);
        
        // Calculate summary metrics
        const totalSessions = sessions.length;
        const totalAttendees = attendanceRecords.length;
        const averageAttendance = totalSessions > 0 
            ? (totalAttendees / totalSessions).toFixed(1) 
            : 0;
        
        res.json({
            dailyAttendance,
            courseDistribution,
            totalSessions,
            totalAttendees,
            averageAttendance
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: "Error fetching analytics data", error: error.message });
    }
});

// Register a Student (New route for student registration)
router.post("/register-student", protect, adminMiddleware, async (req, res) => {
  try {
    const { first_name, last_name, email, program_id } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "❌ User already exists" });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Generate a student ID
    const studentId = `STU${Date.now().toString().slice(-6)}`;
    
    // Create new student user
    user = new Student({
      first_name,
      last_name,
      email,
      password_hash: hashedPassword,
      role: 'student',
      program_id,
      student_id: studentId,
      isApproved: true
    });

    await user.save();

    // Get all courses for the program
    const programCourses = await Course.find({ program_id: program_id });
    const enrollments = [];
    const currentSemester = 'Current'; // Should be dynamically determined
    const currentAcademicYear = new Date().getFullYear() + '-' + (new Date().getFullYear() + 1);

    // Auto-enroll student in all program courses
    for (const course of programCourses) {
      // Find lecturers for this course
      const lecturers = course.lecturers && course.lecturers.length > 0 
        ? course.lecturers 
        : await Lecturer.find({ taught_courses: course._id });

      if (lecturers && lecturers.length > 0) {
        // Create enrollment with the first lecturer (this could be expanded to handle multiple lecturers)
        const lecturerId = Array.isArray(lecturers) ? lecturers[0]._id : lecturers._id;
        
        const enrollment = new Enrollment({
          studentId: user._id,
          courseId: course._id,
          lecturerId: lecturerId,
          programId: program_id,
          semester: currentSemester,
          academicYear: currentAcademicYear,
          status: 'enrolled'
        });

        await enrollment.save();
        enrollments.push(enrollment);

        // Add student to course's students array
        await Course.findByIdAndUpdate(
          course._id,
          { $addToSet: { students: user._id } }
        );
      }
    }

    // Send welcome email with credentials
    try {
      await sendWelcomeEmail(email, tempPassword, `${first_name} ${last_name}`, 'student');
      res.status(201).json({
        msg: "✅ Student registered successfully and enrolled in program courses. Login credentials sent to their email.",
        tempPassword,
        user: {
          id: user._id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
          program_id: user.program_id,
          student_id: user.student_id
        },
        enrollments: enrollments.length
      });
    } catch (emailError) {
      // If email fails, still return success but with the password in response
      console.error('Email sending failed:', emailError);
      res.status(201).json({
        msg: "✅ Student registered and enrolled in program courses, but email failed. Temporary password: " + tempPassword,
        tempPassword,
        user: {
          id: user._id,
          first_name: user.first_name,
          last_name: user.last_name, 
          email: user.email,
          role: user.role,
          program_id: user.program_id,
          student_id: user.student_id
        },
        enrollments: enrollments.length
      });
    }
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// Approve a user
router.put("/users/:userId/approve", protect, adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "❌ User not found" });
    }
    
    // Update user approval status
    user.isApproved = true;
    await user.save();
    
    res.status(200).json({ 
      msg: "✅ User approved successfully",
      user: {
        id: user._id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        isApproved: user.isApproved
      }
    });
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// Better GET route for courses with improved population
router.get('/courses-detailed', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized as admin' });
    }

    console.log('Fetching detailed courses for admin');
    
    // Find all courses
    const courses = await Course.find()
      .populate('program_id', 'name code')
      .populate('faculty', 'name code')
      .populate('department', 'name code');
    
    // Create an array to hold the processed courses
    const processedCourses = [];
    
    // Process each course
    for (const course of courses) {
      console.log('Processing course:', course.course_name, 'Program ID:', course.program_id);
      
      // Start with the basic course data
      const courseData = course.toObject({ virtuals: true });
      
      // Get program details
      let programDetails = null;
      if (course.program_id) {
        try {
          programDetails = await Program.findById(course.program_id)
            .populate('facultyId', 'name code')
            .populate('departmentId', 'name code');
            
          console.log('Found program details:', programDetails ? programDetails.name : 'Not found');
        } catch (err) {
          console.error('Error getting program details:', err);
        }
      }
      
      // Get faculty and department data
      let faculty = null;
      let department = null;
      
      // First try direct faculty/department references
      if (course.faculty) {
        faculty = await mongoose.model('Faculty').findById(course.faculty).select('name code');
      }
      
      if (course.department) {
        department = await mongoose.model('Department').findById(course.department).select('name code');
      }
      
      // If not found, try to get from program
      if (!faculty && programDetails?.facultyId) {
        faculty = programDetails.facultyId;
      }
      
      if (!department && programDetails?.departmentId) {
        department = programDetails.departmentId;
      }
      
      // Create the processed course object
      const processedCourse = {
        _id: course._id,
        id: course._id,
        name: course.course_name,
        course_name: course.course_name,
        code: course.course_code,
        course_code: course.course_code,
        program_id: course.program_id,
        programId: course.program_id,
        program: programDetails ? {
          id: programDetails._id,
          _id: programDetails._id,
          name: programDetails.name,
          code: programDetails.code
        } : course.program_id ? {
          id: course.program_id._id || course.program_id,
          _id: course.program_id._id || course.program_id,
          name: course.program_id.name || 'Unknown',
          code: course.program_id.code || 'Unknown'
        } : null,
        faculty: faculty,
        department: department,
        facultyId: faculty,
        departmentId: department,
        description: course.description,
        credits: course.credits,
        semester: course.semester,
        programYear: course.programYear,
        status: course.status
      };
      
      processedCourses.push(processedCourse);
    }
    
    console.log(`Processed ${processedCourses.length} courses with detailed information`);
    res.json(processedCourses);
  } catch (err) {
    console.error('Error fetching detailed courses:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

module.exports = router;
