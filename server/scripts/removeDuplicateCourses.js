// Script to clean up duplicate and null course codes
const mongoose = require('mongoose');
const Course = require('../models/Course');
require('dotenv').config();

async function cleanUpCourses() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/test';
    console.log('Connecting to MongoDB:', mongoUri);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // Timeout after 5s
    });
    
    console.log('Connected to MongoDB');

    // Find any courses with null course_code
    const nullCodeCourses = await Course.find({ $or: [
      { course_code: null },
      { course_code: '' },
      { course_code: { $exists: false } }
    ]});
    
    console.log(`Found ${nullCodeCourses.length} courses with null/empty code`);

    // Delete those courses
    if (nullCodeCourses.length > 0) {
      for (const course of nullCodeCourses) {
        console.log(`Deleting course with ID: ${course._id}`);
        await Course.findByIdAndDelete(course._id);
      }
      console.log(`Deleted ${nullCodeCourses.length} invalid courses`);
    }

    // Find duplicate course codes
    const allCourses = await Course.find({}).sort({ createdAt: -1 });
    const courseCodes = {};
    const duplicates = [];

    // Identify duplicates (keeping the newest ones)
    for (const course of allCourses) {
      if (course.course_code) {
        if (courseCodes[course.course_code]) {
          duplicates.push(course._id);
        } else {
          courseCodes[course.course_code] = course._id;
        }
      }
    }

    console.log(`Found ${duplicates.length} duplicate course codes`);

    // Delete duplicate courses
    if (duplicates.length > 0) {
      for (const id of duplicates) {
        console.log(`Deleting duplicate course with ID: ${id}`);
        await Course.findByIdAndDelete(id);
      }
      console.log(`Deleted ${duplicates.length} duplicate courses`);
    }

    console.log('Database cleanup completed successfully');
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning up courses:', error);
    try {
      mongoose.connection.close();
    } catch (e) {
      console.error('Error closing mongoose connection:', e);
    }
    process.exit(1);
  }
}

cleanUpCourses(); 