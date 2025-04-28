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
    const { program_id } = req.query;
    let query = {};
    
    // Add program filter if provided
    if (program_id) {
      query.program_id = program_id;
    }
    
    const courses = await Course.find(query)
      .populate('program_id', 'name')
      .populate('lecturers', 'first_name last_name')
      .sort({ course_name: 1 });

    res.json(courses);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   POST api/courses/:courseId/assign-lecturer
// @desc    Assign lecturer(s) to a course
// @access  Private (admin only)
router.post('/:courseId/assign-lecturer', protect, async (req, res) => {
  try {
    // Verify admin permissions
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized. Admin access only.' });
    }

    const { lecturerIds } = req.body;
    const { courseId } = req.params;

    if (!lecturerIds || !Array.isArray(lecturerIds) || lecturerIds.length === 0) {
      return res.status(400).json({ msg: 'Please provide at least one lecturer ID' });
    }

    // Find course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    // Verify all lecturers exist and have lecturer role
    const lecturers = await Lecturer.find({ 
      _id: { $in: lecturerIds },
      role: 'lecturer'
    });

    if (lecturers.length !== lecturerIds.length) {
      return res.status(400).json({ msg: 'One or more invalid lecturer IDs provided' });
    }

    // Update course with lecturers
    course.lecturers = lecturerIds;
    await course.save();

    // Update each lecturer's taught_courses
    for (const lecturerId of lecturerIds) {
      await Lecturer.findByIdAndUpdate(
        lecturerId,
        { $addToSet: { taught_courses: courseId } }
      );
    }

    // Return updated course with populated lecturer data
    const updatedCourse = await Course.findById(courseId)
      .populate('lecturers', 'first_name last_name email')
      .populate('program_id', 'name');

    res.json({
      msg: 'Lecturer(s) assigned to course successfully',
      course: updatedCourse
    });

  } catch (err) {
    console.error('Error assigning lecturer to course:', err);
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
      _id: { $in: lecturer.taught_courses || [] } 
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

// @route   PUT api/courses/:courseId/lecturers
// @desc    Assign a lecturer to a course
// @access  Private (admin only)
router.put('/:courseId/lecturers', protect, async (req, res) => {
  try {
    // Verify user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized. Admin access only.' });
    }
    
    const { lecturerId } = req.body;
    const { courseId } = req.params;
    
    // Validate lecturer exists and is a lecturer
    const lecturer = await User.findById(lecturerId);
    if (!lecturer || lecturer.role !== 'lecturer') {
      return res.status(400).json({ msg: 'Invalid lecturer' });
    }
    
    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }
    
    // Add lecturer to course's lecturers array if not already there
    if (!course.lecturers.includes(lecturerId)) {
      course.lecturers.push(lecturerId);
      await course.save();
    }
    
    // Add course to lecturer's taught_courses array if not already there
    if (lecturer.taught_courses && !lecturer.taught_courses.includes(courseId)) {
      await Lecturer.findByIdAndUpdate(
        lecturerId,
        { $addToSet: { taught_courses: courseId } }
      );
    }
    
    res.json({ 
      msg: 'Lecturer assigned to course successfully',
      course: {
        _id: course._id,
        course_name: course.course_name,
        course_code: course.course_code,
        lecturers: course.lecturers
      }
    });
  } catch (err) {
    console.error('Error assigning lecturer to course:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

module.exports = router; 