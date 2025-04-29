const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const isStudent = require("../../middleware/isStudent");
const { body, validationResult } = require("express-validator");
const db = require("../../db");

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

module.exports = router; 