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
      .populate('faculty', 'name')
      .populate('department', 'name')
      .populate('lecturers', 'first_name last_name')
      .sort({ course_name: 1 });

    // Format response to include faculty and department names
    const formattedCourses = courses.map(course => ({
      _id: course._id,
      name: course.course_name,
      code: course.course_code,
      program: course.program_id?.name || 'N/A',
      faculty: course.faculty?.name || 'Not Specified',
      department: course.department?.name || 'Not Specified',
      credits: course.credits,
      semester: course.semester,
      programYear: course.programYear,
      description: course.description || '',
      lecturers: course.lecturers?.map(l => `${l.first_name} ${l.last_name}`).join(', ') || 'No lecturer assigned'
    }));

    res.json(formattedCourses);
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
    // Extract lecturer ID from the authenticated user
    const userId = req.user.id || req.user._id;
    
    console.log(`Fetching courses for lecturer with user ID: ${userId}`);
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID not provided in authentication token' 
      });
    }

    // Find courses where this lecturer is assigned
    const courses = await Course.find({
      lecturers: userId
    }).populate('program_id', 'name');

    console.log(`Found ${courses.length} courses for lecturer with ID: ${userId}`);

    // Get unique program names from the courses
    const programNames = [...new Set(
      courses
        .filter(course => course.program_id)
        .map(course => course.program_id.name)
    )];

    // Send detailed response
    res.json({
      success: true,
      courses: courses.map(course => ({
        id: course._id,
        name: course.name || course.course_name,
        code: course.code || course.course_code,
        program: course.program_id?.name || 'N/A',
        credits: course.credits,
        description: course.description || '',
        enrolledStudents: course.students?.length || 0,
        createdAt: course.createdAt
      })),
      programNames,
      totalCourses: courses.length
    });
  } catch (error) {
    console.error('Error fetching lecturer courses:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching lecturer courses',
      error: error.message 
    });
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

// @route   GET api/courses/:courseId
// @desc    Get a single course by ID
// @access  Private (all authenticated users)
router.get('/:courseId', protect, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    
    if (!courseId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Course ID is required' 
      });
    }
    
    console.log(`Fetching course with ID: ${courseId}`);
    
    const course = await Course.findById(courseId)
      .populate('program_id', 'name')
      .populate('lecturers', 'first_name last_name email');
      
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }
    
    res.json(course);
  } catch (err) {
    console.error(`Error fetching course: ${err.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching course',
      error: err.message 
    });
  }
});

module.exports = router;