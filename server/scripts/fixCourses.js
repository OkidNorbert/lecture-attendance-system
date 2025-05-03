require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');

async function fixCourses() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/your_database_name', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Find courses with null course codes
    const coursesWithNullCode = await Course.find({
      $or: [
        { course_code: null },
        { course_code: '' },
        { course_code: { $exists: false } }
      ]
    });

    console.log(`Found ${coursesWithNullCode.length} courses with null/empty course codes`);

    // Delete these courses as they are invalid
    if (coursesWithNullCode.length > 0) {
      await Course.deleteMany({
        $or: [
          { course_code: null },
          { course_code: '' },
          { course_code: { $exists: false } }
        ]
      });
      console.log('Deleted courses with null/empty course codes');
    }

    // Verify the fix
    const remainingNullCodes = await Course.find({
      $or: [
        { course_code: null },
        { course_code: '' },
        { course_code: { $exists: false } }
      ]
    });

    if (remainingNullCodes.length === 0) {
      console.log('Successfully fixed all courses with null/empty course codes');
    } else {
      console.log('Warning: Some courses with null/empty codes still exist');
    }

  } catch (error) {
    console.error('Error fixing courses:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

fixCourses(); 