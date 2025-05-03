// update-user.js - Simple script to update a student record
const mongoose = require('mongoose');

// Import the User model
const { User } = require('./models/User');

const MONGO_URI = 'mongodb+srv://admin:admin123@lecture-attendance-db.eqpss.mongodb.net/attendance-db?retryWrites=true&w=majority';

async function updateUser() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find the student by email
    const student = await User.findOne({ email: 'okidi@students.ucu.ac.ug' });
    
    if (!student) {
      console.log('Student not found');
      return;
    }
    
    console.log('Found student:', student.email);
    console.log('Current data:', {
      program_id: student.program_id,
      semester: student.semester,
      programYear: student.programYear
    });
    
    // Update the student with program information
    student.program_id = mongoose.Types.ObjectId('67d31f9249ed8ee2548ef332'); // BSCS program ID
    student.semester = '1';
    student.programYear = 1;
    
    // Save the changes
    await student.save();
    
    // Verify the update
    const updatedStudent = await User.findOne({ email: 'okidi@students.ucu.ac.ug' })
      .populate('program_id', 'name code');
    
    console.log('Updated student:', {
      email: updatedStudent.email,
      program: updatedStudent.program_id ? {
        id: updatedStudent.program_id._id,
        name: updatedStudent.program_id.name
      } : null,
      semester: updatedStudent.semester,
      programYear: updatedStudent.programYear
    });
    
    console.log('Update successful!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  }
}

// Run the update function
updateUser(); 