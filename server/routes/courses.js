const express = require('express');
const authMiddleware = require('../middleware/auth');
const Course = require('../models/Course');
const User = require('../models/User');
const router = express.Router();

// @route   GET api/courses/lecturer
// @desc    Get courses assigned to the authenticated lecturer
// @access  Private (lecturer only)
router.get('/lecturer', authMiddleware, async (req, res) => {
  try {
    // Verify user is a lecturer
    if (req.user.role !== 'lecturer') {
      return res.status(403).json({ msg: 'Not authorized. Lecturer access only.' });
    }

    // Get lecturer with populated courses
    const lecturer = await User.findById(req.user.id).populate('courses');
    
    if (!lecturer) {
      return res.status(404).json({ msg: 'Lecturer not found' });
    }

    // Get detailed course information
    const courses = await Course.find({ 
      _id: { $in: lecturer.courses } 
    })
    .populate('facultyId', 'name')
    .populate('departmentId', 'name')
    .populate('programId', 'name');

    // Extract unique departments and programs for filtering
    const departments = [...new Set(courses.map(course => course.departmentId?.name))].filter(Boolean);
    const programs = [...new Set(courses.map(course => course.programId?.name))].filter(Boolean);

    // Format the response
    const formattedCourses = courses.map(course => ({
      id: course._id,
      name: course.name,
      code: course.code,
      department: course.departmentId?.name,
      program: course.programId?.name,
      credits: course.credits
    }));

    res.json({
      courses: formattedCourses,
      departments,
      programs
    });
  } catch (err) {
    console.error('Error fetching lecturer courses:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

module.exports = router; 