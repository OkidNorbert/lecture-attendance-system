const XLSX = require('xlsx-js-style');
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

exports.bulkImport = async (req, res) => {
  try {
    const lecturers = req.body;
    
    // Validate all records before importing
    const validationErrors = [];
    lecturers.forEach((lecturer, index) => {
      if (!lecturer.name || !lecturer.email || !lecturer.department) {
        validationErrors.push(`Row ${index + 1}: Missing required fields`);
      }
      if (lecturer.email && !/\S+@\S+\.\S+/.test(lecturer.email)) {
        validationErrors.push(`Row ${index + 1}: Invalid email format`);
      }
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: 'Validation errors',
        errors: validationErrors
      });
    }

    // Process imports in batches
    const batchSize = 100;
    const results = [];
    
    for (let i = 0; i < lecturers.length; i += batchSize) {
      const batch = lecturers.slice(i, i + batchSize);
      const operations = batch.map(lecturer => ({
        updateOne: {
          filter: { email: lecturer.email },
          update: { $set: lecturer },
          upsert: true
        }
      }));
      
      const result = await Lecturer.bulkWrite(operations);
      results.push(result);
    }

    res.status(200).json({
      message: 'Bulk import completed successfully',
      results
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error during bulk import',
      error: error.message
    });
  }
}; 