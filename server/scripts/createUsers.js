const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Get MongoDB connection string from env
const connectionString = process.env.MONGODB_URI;

console.log('Attempting to connect to MongoDB Atlas...');
// Log URI without password for debugging
const sanitizedUri = connectionString.replace(/:([^@]+)@/, ':****@');
console.log('Using connection string:', sanitizedUri);

mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB Atlas connected successfully'))
  .catch(err => {
    console.error('MongoDB Atlas connection error:', err);
    process.exit(1);
  });

async function createTestUsers() {
  try {
    console.log('Starting test user creation...');
    
    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const lecturerPassword = await bcrypt.hash('lecturer123', salt);
    const studentPassword = await bcrypt.hash('student123', salt);
    
    // Check if test users already exist
    const existingLecturer = await User.findOne({ email: 'lecturer@example.com' });
    const existingStudent = await User.findOne({ email: 'student@example.com' });
    
    // Create lecturer if not exists
    if (!existingLecturer) {
      const lecturer = new User({
        name: 'Test Lecturer',
        email: 'lecturer@example.com',
        password: lecturerPassword,
        role: 'lecturer',
        isApproved: true,
        isActive: true
      });
      
      await lecturer.save();
      console.log('Test lecturer created successfully');
      console.log('Lecturer credentials:');
      console.log('Email: lecturer@example.com');
      console.log('Password: lecturer123');
    } else {
      console.log('Test lecturer already exists');
    }
    
    // Create student if not exists
    if (!existingStudent) {
      const student = new User({
        name: 'Test Student',
        email: 'student@example.com',
        password: studentPassword,
        role: 'student',
        isApproved: true,
        isActive: true
      });
      
      await student.save();
      console.log('Test student created successfully');
      console.log('Student credentials:');
      console.log('Email: student@example.com');
      console.log('Password: student123');
    } else {
      console.log('Test student already exists');
    }
    
  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createTestUsers(); 