const express = require('express');
const router = express.Router();
const Program = require('../models/Program');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/programs
// @desc    Get all programs
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const programs = await Program.find()
      .populate('facultyId', 'name')
      .populate('departmentId', 'name')
      .populate('courses', 'course_code course_name')
      .populate('lecturers', 'name email')
      .populate('students', 'name email');

    res.json(programs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 