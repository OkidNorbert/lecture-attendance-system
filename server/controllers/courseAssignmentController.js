const CourseAssignment = require('../models/CourseAssignment');
const Lecturer = require('../models/Lecturer');

exports.createAssignment = async (req, res) => {
  try {
    const { lecturerId, courseId, semester, academicYear, studentYear, courseUnit } = req.body;

    // Check for existing assignment
    const existingAssignment = await CourseAssignment.findOne({
      lecturer: lecturerId,
      course: courseId,
      semester,
      academicYear
    });

    if (existingAssignment) {
      return res.status(400).json({ 
        message: 'This course is already assigned to this lecturer for the specified semester and year' 
      });
    }

    const assignment = new CourseAssignment({
      lecturer: lecturerId,
      course: courseId,
      semester,
      academicYear,
      studentYear,
      courseUnit
    });

    await assignment.save();

    // Update lecturer's courses
    await Lecturer.findByIdAndUpdate(
      lecturerId,
      { $addToSet: { courses: courseId } }
    );

    res.status(201).json({ message: 'Course assigned successfully', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning course', error: error.message });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const assignments = await CourseAssignment.find()
      .populate('lecturer', 'name email')
      .populate('course', 'name code');
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const assignment = await CourseAssignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    res.status(200).json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating assignment', error: error.message });
  }
}; 