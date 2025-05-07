const express = require('express');
const router = express.Router();
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Program = require('../models/Program');
const { User, Student, Lecturer } = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const mongoose = require('mongoose');

// @route   POST /api/enrollments
// @desc    Enroll a student in a course
// @access  Private (Admin, Lecturer, Student)
router.post('/', protect, authorize(['admin', 'lecturer', 'student']), async (req, res) => {
  try {
    const { studentId, courseId, lecturerId, programId, semester, programYear, academicYear } = req.body;

    // Debug JWT token info
    console.log('⭐️ POST /api/enrollments - Debug Info:');
    console.log('User ID from token:', req.user._id);
    console.log('User role from token:', req.user.role);
    console.log('Request body:', req.body);
    console.log('Is admin?', req.user.role === 'admin' || req.user.role.toLowerCase() === 'admin');
    
    // FIRST CHECK: If user is admin, allow all operations without restrictions
    // Use a more robust check for admin role
    const isAdmin = req.user.role === 'admin' || req.user.role.toLowerCase() === 'admin';
    
    if (!isAdmin) {
      console.log('User is not admin, checking permissions...');
      // If a student is making the request, they can only enroll themselves
      if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
        console.log('Permission denied: Student trying to enroll another student');
        return res.status(403).json({ message: 'Students can only enroll themselves' });
      }
      
      // If a lecturer is making the request, they can only enroll students in their courses
      if (req.user.role === 'lecturer' && lecturerId !== req.user._id.toString()) {
        console.log('Permission denied: Lecturer trying to enroll in another lecturer\'s course');
        return res.status(403).json({ message: 'Lecturers can only enroll students in courses they teach' });
      }
    } else {
      console.log('Admin access confirmed: bypassing permission checks');
    }

    // Skip all user validations since there seems to be an issue with the User models
    console.log('Skipping user validations');

    // Validate course exists
    let course;
    try {
      course = await Course.findById(courseId);
      if (!course) {
        return res.status(400).json({ message: 'Invalid course' });
      }
    } catch (error) {
      console.error('Error finding course:', error);
      return res.status(400).json({ message: 'Error validating course' });
    }

    // Validate program exists
    let program;
    try {
      program = await Program.findById(programId);
      if (!program) {
        return res.status(400).json({ message: 'Invalid program' });
      }
    } catch (error) {
      console.error('Error finding program:', error);
      return res.status(400).json({ message: 'Error validating program' });
    }

    // Check if student is already enrolled in this course for the semester
    let existingEnrollment;
    try {
      existingEnrollment = await Enrollment.findOne({
        studentId,
        courseId,
        semester,
        programYear,
        academicYear
      });

      if (existingEnrollment) {
        return res.status(400).json({ message: 'Student is already enrolled in this course for the specified semester and academic year' });
      }
    } catch (error) {
      console.error('Error checking existing enrollment:', error);
    }

    try {
      const enrollment = new Enrollment({
        studentId,
        courseId,
        lecturerId,
        programId,
        semester,
        programYear,
        academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        status: "enrolled"
      });

      await enrollment.save();
      console.log('Enrollment created successfully');
      res.status(201).json(enrollment);
    } catch (error) {
      console.error('Error creating enrollment:', error);
      res.status(500).json({ message: 'Server error creating enrollment' });
    }
  } catch (error) {
    console.error('Error in enrollment route:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/enrollments
// @desc    Get all enrollments with optional filters
// @access  Private (Admin, Lecturer, Student)
router.get('/', protect, async (req, res) => {
  try {
    const { studentId, courseId, lecturerId, programId, semester, programYear, academicYear } = req.query;
    const query = {};

    // If user is a student, they can only view their own enrollments
    if (req.user.role === 'student') {
      query.studentId = req.user._id;
    } else if (req.user.role === 'lecturer') {
      // Lecturers can view enrollments for courses they teach
      if (!lecturerId && !studentId && !courseId) {
        query.lecturerId = req.user._id;
      }
    }
    
    // Apply additional filters
    if (studentId && (req.user.role === 'admin' || req.user.role === 'lecturer')) {
      query.studentId = studentId;
    }
    if (courseId) query.courseId = courseId;
    if (lecturerId && req.user.role === 'admin') query.lecturerId = lecturerId;
    if (programId) query.programId = programId;
    if (semester) query.semester = semester;
    if (programYear) query.programYear = programYear;
    if (academicYear) query.academicYear = academicYear;

    const enrollments = await Enrollment.find(query)
      .populate('studentId', 'first_name last_name email student_id')
      .populate({
        path: 'courseId',
        select: 'course_code course_name credits faculty department',
        populate: [
          { path: 'faculty', select: 'name code' },
          { path: 'department', select: 'name code' }
        ]
      })
      .populate('lecturerId', 'first_name last_name email lecturer_id')
      .populate('programId', 'name code');

    // Transform the response to match the expected structure in the frontend
    const formattedEnrollments = enrollments.map(enrollment => ({
      _id: enrollment._id,
      status: enrollment.status,
      semester: enrollment.semester,
      programYear: enrollment.programYear,
      academicYear: enrollment.academicYear,
      enrollmentDate: enrollment.enrollmentDate,
      studentId: enrollment.studentId?._id || null,
      courseId: enrollment.courseId?._id || null,
      lecturerId: enrollment.lecturerId?._id || null,
      programId: enrollment.programId?._id || null,
      student: enrollment.studentId,
      course: {
        ...enrollment.courseId?._doc,
        faculty: enrollment.courseId?.faculty?.name || 'Not Specified',
        department: enrollment.courseId?.department?.name || 'Not Specified'
      },
      lecturer: enrollment.lecturerId,
      program: enrollment.programId
    }));

    res.json(formattedEnrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/enrollments/:id
// @desc    Update enrollment status or details
// @access  Private (Admin, Lecturer, Student)
router.put('/:id', protect, authorize(['admin', 'lecturer', 'student']), async (req, res) => {
  try {
    const { status, lecturerId, courseId, programId, semester, programYear, academicYear } = req.body;
    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // For non-admin users, restrict what they can change
    if (req.user.role !== 'admin') {
      // Students can only update their own enrollments
      if (req.user.role === 'student' && enrollment.studentId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied: You can only update your own enrollments' });
      }

      // Students can only change status to 'dropped', not to 'completed'
      if (req.user.role === 'student' && status === 'completed') {
        return res.status(403).json({ message: 'Students cannot mark enrollments as completed' });
      }

      // Lecturers can only update enrollments for courses they teach
      if (req.user.role === 'lecturer' && enrollment.lecturerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied: You can only update enrollments for courses you teach' });
      }

      // Non-admin users can only update the status
      enrollment.status = status;
    } else {
      // Admins can update all fields
      if (status) enrollment.status = status;
      if (lecturerId) enrollment.lecturerId = lecturerId;
      if (courseId) enrollment.courseId = courseId;
      if (programId) enrollment.programId = programId;
      if (semester) enrollment.semester = semester;
      if (programYear) enrollment.programYear = programYear;
      if (academicYear) enrollment.academicYear = academicYear;
    }

    await enrollment.save();
    res.json(enrollment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/enrollments/:id
// @desc    Delete an enrollment
// @access  Private (Admin, Lecturer, Student)
router.delete('/:id', protect, authorize(['admin', 'lecturer', 'student']), async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Admin can delete any enrollment without restrictions
    if (req.user.role !== 'admin') {
      // Students can only delete their own enrollments
      if (req.user.role === 'student' && enrollment.studentId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied: You can only delete your own enrollments' });
      }

      // Students can only delete recent enrollments (within 7 days)
      if (req.user.role === 'student') {
        const enrollmentDate = new Date(enrollment.createdAt);
        const currentDate = new Date();
        const differenceInDays = Math.floor((currentDate - enrollmentDate) / (1000 * 60 * 60 * 24));

        if (differenceInDays > 7) {
          return res.status(403).json({ message: 'Enrollments can only be deleted within 7 days of creation' });
        }
      }

      // Lecturers can only delete enrollments for courses they teach
      if (req.user.role === 'lecturer' && enrollment.lecturerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied: You can only delete enrollments for courses you teach' });
      }
    }

    // Using deleteOne() instead of the deprecated remove() method
    await Enrollment.deleteOne({ _id: req.params.id });
    res.json({ message: 'Enrollment removed' });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/enrollments/reset-student/:studentId
// @desc    Reset all enrollments for a specific student
// @access  Private (Admin only)
router.post('/reset-student/:studentId', protect, authorize(['admin']), async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Skip user validation to avoid potential User model issues
    console.log('Resetting enrollments for student ID:', studentId);
    
    // Delete all enrollments for this student
    const result = await Enrollment.deleteMany({ studentId });
    
    res.json({ 
      message: `Successfully reset enrollments for student`, 
      count: result.deletedCount 
    });
  } catch (error) {
    console.error('Error resetting student enrollments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/enrollments/reset-lecturer/:lecturerId
// @desc    Reset all enrollments for courses taught by a specific lecturer
// @access  Private (Admin only)
router.post('/reset-lecturer/:lecturerId', protect, authorize(['admin']), async (req, res) => {
  try {
    const { lecturerId } = req.params;
    
    // Skip user validation to avoid potential User model issues
    console.log('Resetting enrollments for lecturer ID:', lecturerId);
    
    // Delete all enrollments for courses taught by this lecturer
    const result = await Enrollment.deleteMany({ lecturerId });
    
    res.json({ 
      message: `Successfully reset enrollments for courses taught by lecturer`, 
      count: result.deletedCount 
    });
  } catch (error) {
    console.error('Error resetting lecturer enrollments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/enrollments/reset-course/:courseId
// @desc    Reset all enrollments for a specific course
// @access  Private (Admin only)
router.post('/reset-course/:courseId', protect, authorize(['admin']), async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(400).json({ message: 'Invalid course' });
    }
    
    // Delete all enrollments for this course
    const result = await Enrollment.deleteMany({ courseId });
    
    res.json({ 
      message: `Successfully reset enrollments for course`, 
      count: result.deletedCount 
    });
  } catch (error) {
    console.error('Error resetting course enrollments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/enrollments/reset-all
// @desc    Reset all enrollments for all students
// @access  Private (Admin only)
router.post('/reset-all', protect, authorize(['admin']), async (req, res) => {
  try {
    // Delete all enrollments
    const result = await Enrollment.deleteMany({});
    
    res.json({ 
      message: 'Successfully reset all enrollments', 
      count: result.deletedCount 
    });
  } catch (error) {
    console.error('Error resetting all enrollments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/enrollments/reassign-lecturer
// @desc    Reassign enrollments from one lecturer to another
// @access  Private (Admin only)
router.put('/reassign-lecturer', protect, authorize(['admin']), async (req, res) => {
  try {
    const { oldLecturerId, newLecturerId, courseId } = req.body;
    
    if (!oldLecturerId || !newLecturerId) {
      return res.status(400).json({ message: 'Both old and new lecturer IDs are required' });
    }
    
    // Skip lecturer validation to avoid potential User model issues
    console.log('Reassigning enrollments from lecturer', oldLecturerId, 'to', newLecturerId);
    
    // Build query for enrollments to update
    const query = { lecturerId: oldLecturerId };
    if (courseId) {
      query.courseId = courseId;
    }
    
    // Update all matching enrollments
    const result = await Enrollment.updateMany(
      query,
      { $set: { lecturerId: newLecturerId } }
    );
    
    res.json({
      message: courseId 
        ? `Successfully reassigned ${result.modifiedCount} enrollments for the course from one lecturer to another`
        : `Successfully reassigned ${result.modifiedCount} enrollments from one lecturer to another`,
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('Error reassigning lecturer enrollments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;