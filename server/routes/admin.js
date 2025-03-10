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
    const users = await User.find({}, '-password');
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
    const courses = await Course.find()
      .populate('department', 'name code')
      .populate({
        path: 'programs',
        populate: [
          { 
            path: 'program',
            select: 'name code'
          },
          {
            path: 'lecturer',
            select: 'name email'
          }
        ]
      });
    
    res.json(courses);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ 
      msg: "❌ Server error", 
      error: err.message 
    });
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
    const { name, code, semester, year, department, programs } = req.body;

    // Validate department
    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
      return res.status(404).json({ msg: "❌ Department not found" });
    }

    // Validate programs
    for (const prog of programs) {
      const programExists = await Program.findById(prog.program);
      if (!programExists) {
        return res.status(404).json({ 
          msg: `❌ Program with ID ${prog.program} not found` 
        });
      }
      if (prog.lecturer) {
        const lecturerExists = await User.findOne({ 
          _id: prog.lecturer,
          role: 'lecturer'
        });
        if (!lecturerExists) {
          return res.status(404).json({ 
            msg: `❌ Lecturer with ID ${prog.lecturer} not found` 
          });
        }
      }
    }

    // Check for duplicate course code in department
    const existingCourse = await Course.findOne({
      code: { $regex: new RegExp(`^${code}$`, 'i') },
      department
    });

    if (existingCourse) {
      return res.status(400).json({ 
        msg: "❌ Course with this code already exists in this department" 
      });
    }

    const course = new Course({
      name,
      code,
      semester,
      year,
      department,
      programs
    });

    await course.save();

    // Populate all references before sending response
    const populatedCourse = await Course.findById(course._id)
      .populate('department', 'name code')
      .populate({
        path: 'programs',
        populate: [
          { path: 'program', select: 'name code' },
          { path: 'lecturer', select: 'name email' }
        ]
      });

    res.status(201).json({ 
      msg: "✅ Course added successfully", 
      course: populatedCourse 
    });
  } catch (err) {
    console.error('Error creating course:', err);
    res.status(500).json({ msg: "❌ Server error", error: err.message });
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
      { $addToSet: { courses: course._id } }
    );

    // Remove course from students no longer in the course
    await User.updateMany(
      { 
        _id: { $nin: studentIds },
        courses: course._id 
      },
      { $pull: { courses: course._id } }
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
    const departments = await Department.find().populate('head', 'name email');
    res.json(departments);
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

router.post("/departments", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, code, description, head } = req.body;
    
    const existingDept = await Department.findOne({ 
      $or: [{ name }, { code }] 
    });
    if (existingDept) {
      return res.status(400).json({ msg: "❌ Department already exists" });
    }

    const department = new Department({ name, code, description, head });
    await department.save();

    res.status(201).json({ msg: "✅ Department added successfully", department });
  } catch (err) {
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// Program Routes
router.get("/programs", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const programs = await Program.find()
      .populate('department', 'name code');
    res.json(programs);
  } catch (err) {
    console.error('Error fetching programs:', err);
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

router.post("/programs", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, code, department, duration, description } = req.body;

    // Check if program code already exists
    const existingProgram = await Program.findOne({ 
      $or: [
        { code: { $regex: new RegExp(`^${code}$`, 'i') } },
        { 
          name: { $regex: new RegExp(`^${name}$`, 'i') },
          department: department 
        }
      ]
    });

    if (existingProgram) {
      return res.status(400).json({ 
        msg: "❌ Program with this code or name already exists in this department" 
      });
    }

    // Verify department exists
    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
      return res.status(404).json({ msg: "❌ Department not found" });
    }

    const program = new Program({
      name,
      code,
      department,
      duration,
      description
    });

    await program.save();

    // Populate department details before sending response
    const populatedProgram = await Program.findById(program._id)
      .populate('department', 'name code');

    res.status(201).json({ 
      msg: "✅ Program added successfully", 
      program: populatedProgram 
    });
  } catch (err) {
    console.error('Error creating program:', err);
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// Get programs by department
router.get("/departments/:departmentId/programs", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const programs = await Program.find({ department: req.params.departmentId })
      .populate('department', 'name code');
    res.json(programs);
  } catch (err) {
    console.error('Error fetching department programs:', err);
    res.status(500).json({ msg: "❌ Server error", error: err.message });
  }
});

// Update program
router.put("/programs/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, code, department, duration, description } = req.body;

    // Check if program exists with same code (excluding current program)
    const existingProgram = await Program.findOne({
      _id: { $ne: req.params.id },
      $or: [
        { code: { $regex: new RegExp(`^${code}$`, 'i') } },
        { 
          name: { $regex: new RegExp(`^${name}$`, 'i') },
          department: department 
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
      { name, code, department, duration, description },
      { new: true, runValidators: true }
    ).populate('department', 'name code');

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
            course: course._id,
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
      {
        $pull: {
          courses: {
            course: course._id,
            program: programId
          }
        }
      }
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
    const faculties = await Faculty.find()
      .populate('departments', 'name code');
    res.json(faculties);
  } catch (err) {
    console.error('Error fetching faculties:', err);
    res.status(500).json({ msg: "Server error", error: err.message });
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
    const { name, code, description } = req.body;

    // Check for existing faculty
    const existingFaculty = await Faculty.findOne({ 
      $or: [{ name }, { code }] 
    });
    
    if (existingFaculty) {
      return res.status(400).json({ 
        msg: "Faculty with this name or code already exists" 
      });
    }

    const faculty = new Faculty({
      name,
      code,
      description
    });

    await faculty.save();
    res.status(201).json({ 
      msg: "Faculty created successfully", 
      faculty 
    });
  } catch (err) {
    console.error('Error creating faculty:', err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// Update faculty
router.put("/faculties/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, code, description } = req.body;

    // Check for existing faculty with same name or code
    const existingFaculty = await Faculty.findOne({
      _id: { $ne: req.params.id },
      $or: [{ name }, { code }]
    });

    if (existingFaculty) {
      return res.status(400).json({ 
        msg: "Faculty with this name or code already exists" 
      });
    }

    const faculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      { name, code, description },
      { new: true }
    ).populate('departments', 'name code');

    if (!faculty) {
      return res.status(404).json({ msg: "Faculty not found" });
    }

    res.json({ 
      msg: "Faculty updated successfully", 
      faculty 
    });
  } catch (err) {
    console.error('Error updating faculty:', err);
    res.status(500).json({ msg: "Server error", error: err.message });
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

module.exports = router;
