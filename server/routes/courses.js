const express = require('express');
const { protect } = require('../middleware/auth');
const Course = require('../models/Course');
const { User, Lecturer } = require('../models/User');
const router = express.Router();

// @route   GET api/courses
// @desc    Get all courses
// @access  Private (all authenticated users)
router.get('/', protect, async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('program_id', 'name')
      .sort({ course_name: 1 });

    res.json(courses);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/courses/lecturer
// @desc    Get courses assigned to the authenticated lecturer
// @access  Private (lecturer only)
router.get('/lecturer', protect, async (req, res) => {
  try {
    // Verify user is a lecturer
    if (req.user.role !== 'lecturer') {
      return res.status(403).json({ msg: 'Not authorized. Lecturer access only.' });
    }

    // Get lecturer with populated courses
    const lecturer = await Lecturer.findById(req.user.id);
    
    if (!lecturer) {
      return res.status(404).json({ msg: 'Lecturer not found' });
    }

    // Get detailed course information
    const courses = await Course.find({ 
      _id: { $in: lecturer.course_id ? [lecturer.course_id] : [] } 
    })
    .populate('program_id', 'name');

    // Extract unique programs for filtering
    const programs = [...new Set(courses.map(course => course.program_id?.name))].filter(Boolean);

    // Format the response
    const formattedCourses = courses.map(course => ({
      id: course._id,
      name: course.course_name,
      code: course.course_code,
      program: course.program_id?.name,
      credits: course.credits
    }));

    res.json({
      courses: formattedCourses,
      programs
    });
  } catch (err) {
    console.error('Error fetching lecturer courses:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

module.exports = router; 