// Fix course code script
require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');

async function fixCourseCode() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find courses with null course_code
    const nullCodeCourses = await Course.find({ course_code: null });
    console.log(`Found ${nullCodeCourses.length} courses with null code`);

    // Delete courses with null code
    if (nullCodeCourses.length > 0) {
      for (const course of nullCodeCourses) {
        console.log(`Deleting course: ${course._id}`);
        await Course.findByIdAndDelete(course._id);
      }
      console.log(`Deleted ${nullCodeCourses.length} courses with null code`);
    }

    // Fix the unique index to prevent null values
    console.log('Finished cleaning up null code courses');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing course codes:', error);
    process.exit(1);
  }
}

fixCourseCode(); 