const Lecturer = require('../models/Lecturer');

exports.createLecturer = async (req, res) => {
  try {
    const { name, email, department, specialization, employmentStatus } = req.body;
    
    // Check if lecturer already exists
    const existingLecturer = await Lecturer.findOne({ email });
    if (existingLecturer) {
      return res.status(400).json({ message: 'Lecturer with this email already exists' });
    }

    const lecturer = new Lecturer({
      name,
      email,
      department,
      specialization,
      employmentStatus,
      joinDate: new Date()
    });

    await lecturer.save();
    res.status(201).json({ message: 'Lecturer created successfully', lecturer });
  } catch (error) {
    res.status(500).json({ message: 'Error creating lecturer', error: error.message });
  }
};

exports.getAllLecturers = async (req, res) => {
  try {
    const lecturers = await Lecturer.find()
      .populate('courses', 'name code');
    res.status(200).json(lecturers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching lecturers', error: error.message });
  }
};

exports.updateLecturer = async (req, res) => {
  try {
    const lecturer = await Lecturer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!lecturer) {
      return res.status(404).json({ message: 'Lecturer not found' });
    }
    res.status(200).json(lecturer);
  } catch (error) {
    res.status(500).json({ message: 'Error updating lecturer', error: error.message });
  }
}; 