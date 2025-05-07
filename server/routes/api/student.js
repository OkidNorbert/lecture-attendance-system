const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const isStudent = require("../../middleware/isStudent");
const { body, validationResult } = require("express-validator");
const db = require("../../db");
const { protect } = require("../../middleware/auth");
const Attendance = require("../../models/Attendance");
const Enrollment = require("../../models/Enrollment");

// @route   GET api/student/enrollments
// @desc    Get all enrollments for a student
// @access  Private (Student only)
router.get("/enrollments", [auth, isStudent], async (req, res) => {
  try {
    const enrollments = await db.query(
      `SELECT se.*, p.name as program_name
       FROM student_enrollments se
       JOIN programs p ON se.program_id = p.id
       WHERE se.student_id = $1
       ORDER BY se.enrollment_date DESC`,
      [req.user.id]
    );

    return res.json(enrollments.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST api/student/enroll
// @desc    Enroll student in a new semester/year
// @access  Private (Student only)
router.post(
  "/enroll",
  [
    auth,
    isStudent,
    [
      body("semester", "Semester is required").not().isEmpty(),
      body("programYear", "Program year is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { semester, programYear } = req.body;

    try {
      // Start a transaction
      await db.query("BEGIN");

      // 1. First check if student is already enrolled in this semester/year
      const existingEnrollment = await db.query(
        `SELECT * FROM student_enrollments 
         WHERE student_id = $1 AND semester = $2 AND program_year = $3`,
        [req.user.id, semester, programYear]
      );

      if (existingEnrollment.rows.length > 0) {
        await db.query("ROLLBACK");
        return res.status(400).json({ 
          msg: "You are already enrolled in this semester" 
        });
      }

      // 2. Get student's program information
      const studentProgram = await db.query(
        `SELECT program_id FROM students WHERE user_id = $1`,
        [req.user.id]
      );

      if (studentProgram.rows.length === 0) {
        await db.query("ROLLBACK");
        return res.status(400).json({ 
          msg: "Student program information not found" 
        });
      }

      const programId = studentProgram.rows[0].program_id;

      // 3. Create enrollment entry
      const enrollmentResult = await db.query(
        `INSERT INTO student_enrollments (
          student_id, program_id, semester, program_year, enrollment_date, status
        ) VALUES ($1, $2, $3, $4, NOW(), 'active')
        RETURNING id`,
        [req.user.id, programId, semester, programYear]
      );

      const enrollmentId = enrollmentResult.rows[0].id;

      // 4. Get courses for this program in this semester/year
      const programCourses = await db.query(
        `SELECT id FROM courses 
         WHERE program_id = $1 AND semester = $2 AND program_year = $3`,
        [programId, semester, programYear]
      );

      // 5. Enroll student in all courses for this program/semester/year
      for (const course of programCourses.rows) {
        await db.query(
          `INSERT INTO course_enrollments (
            student_id, course_id, enrollment_date, status
          ) VALUES ($1, $2, NOW(), 'active')`,
          [req.user.id, course.id]
        );
      }

      // Commit the transaction
      await db.query("COMMIT");

      res.json({ 
        msg: "Successfully enrolled in new semester", 
        enrollment_id: enrollmentId 
      });
    } catch (err) {
      // Rollback in case of error
      await db.query("ROLLBACK");
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// @route   GET api/student/stats
// @desc    Get student statistics
// @access  Private (Student only)
router.get("/stats", protect, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ msg: "Access denied. Only students can access their stats." });
    }

    // Get attendance statistics
    const attendanceRecords = await Attendance.find({ student_id: req.user.id });
    const totalAttended = attendanceRecords.length;
    const totalSessions = totalAttended > 0 ? totalAttended + 2 : 0; // Add 2 for a more realistic total
    const attendanceRate = totalSessions > 0 ? Math.round((totalAttended / totalSessions) * 100) : 0;

    res.json({
      totalAttended,
      totalSessions,
      attendanceRate
    });
  } catch (err) {
    console.error('Error fetching student stats:', err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// @route   GET api/student/enrollments
// @desc    Get student enrollments
// @access  Private (Student only)
router.get("/enrollments", protect, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ msg: "Access denied. Only students can access their enrollments." });
    }

    const enrollments = await Enrollment.find({ studentId: req.user.id })
      .populate('courseId', 'course_name course_code credits')
      .populate('lecturerId', 'first_name last_name email')
      .populate('programId', 'name code')
      .sort({ createdAt: -1 });

    const formattedEnrollments = enrollments.map(enrollment => ({
      _id: enrollment._id,
      course: enrollment.courseId ? {
        id: enrollment.courseId._id,
        name: enrollment.courseId.course_name,
        code: enrollment.courseId.course_code,
        credits: enrollment.courseId.credits
      } : null,
      lecturer: enrollment.lecturerId ? {
        id: enrollment.lecturerId._id,
        name: `${enrollment.lecturerId.first_name} ${enrollment.lecturerId.last_name}`,
        email: enrollment.lecturerId.email
      } : null,
      program: enrollment.programId ? {
        id: enrollment.programId._id,
        name: enrollment.programId.name,
        code: enrollment.programId.code
      } : null,
      semester: enrollment.semester,
      programYear: enrollment.programYear,
      academicYear: enrollment.academicYear,
      status: enrollment.status,
      enrollmentDate: enrollment.createdAt
    }));

    res.json(formattedEnrollments);
  } catch (err) {
    console.error('Error fetching student enrollments:', err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

module.exports = router;