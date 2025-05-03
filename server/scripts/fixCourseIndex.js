const mongoose = require('mongoose');
require('dotenv').config();
require('../models/Course');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lecture-attendance';

async function fixCourseIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the Course model
    const Course = mongoose.model('Course');

    // Drop all existing indexes
    await Course.collection.dropIndexes();
    console.log('Dropped all existing indexes');

    // Delete any documents with null or empty course_code
    const result = await Course.deleteMany({
      $or: [
        { course_code: null },
        { course_code: '' }
      ]
    });
    console.log(`Deleted ${result.deletedCount} invalid documents`);

    // Create the compound index
    await Course.collection.createIndex(
      { course_code: 1, program_id: 1 },
      { unique: true }
    );
    console.log('Created compound index on course_code and program_id');

    console.log('Successfully fixed course indexes');
  } catch (error) {
    console.error('Error fixing course indexes:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the fix
fixCourseIndex();
 