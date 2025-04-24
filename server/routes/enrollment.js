const express = require('express');
const router = express.Router();
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Program = require('../models/Program');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/enrollments
// @desc    Enroll a student in a course
// @access  Private (Admin, Lecturer)
router.post('/', protect, authorize(['admin', 'lecturer']), async (req, res) => {
  try {
    const { studentId, courseId, lecturerId, programId, semester, academicYear } = req.body;

    // Validate student exists and is a student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(400).json({ message: 'Invalid student' });
    }

    // Validate lecturer exists and is a lecturer
    const lecturer = await User.findById(lecturerId);
    if (!lecturer || lecturer.role !== 'lecturer') {
      return res.status(400).json({ message: 'Invalid lecturer' });
    }

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(400).json({ message: 'Invalid course' });
    }

    // Validate program exists
    const program = await Program.findById(programId);
    if (!program) {
      return res.status(400).json({ message: 'Invalid program' });
    }

    // Check if student is already enrolled in this course for the semester
    const existingEnrollment = await Enrollment.findOne({
      studentId,
      courseId,
      semester,
      academicYear
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Student is already enrolled in this course for the specified semester' });
    }

    const enrollment = new Enrollment({
      studentId,
      courseId,
      lecturerId,
      programId,
      semester,
      academicYear
    });

    await enrollment.save();
    res.status(201).json(enrollment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/enrollments
// @desc    Get all enrollments with optional filters
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { studentId, courseId, lecturerId, programId, semester, academicYear } = req.query;
    const query = {};

    if (studentId) query.studentId = studentId;
    if (courseId) query.courseId = courseId;
    if (lecturerId) query.lecturerId = lecturerId;
    if (programId) query.programId = programId;
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;

    const enrollments = await Enrollment.find(query)
      .populate('student', 'name email')
      .populate('course', 'course_code course_name')
      .populate('lecturer', 'name email')
      .populate('program', 'name code');

    res.json(enrollments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/enrollments/:id
// @desc    Update enrollment status
// @access  Private (Admin, Lecturer)
router.put('/:id', protect, authorize(['admin', 'lecturer']), async (req, res) => {
  try {
    const { status } = req.body;
    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    enrollment.status = status;
    await enrollment.save();

    res.json(enrollment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/enrollments/:id
// @desc    Delete an enrollment
// @access  Private (Admin, Lecturer)
router.delete('/:id', protect, authorize(['admin', 'lecturer']), async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    await enrollment.remove();
    res.json({ message: 'Enrollment removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 