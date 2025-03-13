const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required']
  },
  lecturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Lecturer ID is required']
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    default: 'present',
    required: true
  },
  checkInTime: {
    type: Date
  },
  location: {
    type: String,
    trim: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
AttendanceSchema.index({ studentId: 1, courseId: 1, date: 1 });
AttendanceSchema.index({ courseId: 1, date: 1 });
AttendanceSchema.index({ lecturerId: 1, date: 1 });

// Add compound index for unique attendance per student per course per date
AttendanceSchema.index({ 
  studentId: 1, 
  courseId: 1, 
  date: 1 
}, { 
  unique: true 
});

// Static method to generate sample data
AttendanceSchema.statics.generateSampleData = async function() {
  const Course = mongoose.model('Course');
  const User = mongoose.model('User');

  // Get some real courses and users from the database
  const courses = await Course.find().limit(3);
  const students = await User.find({ role: 'student' }).limit(5);
  const lecturers = await User.find({ role: 'lecturer' }).limit(2);

  if (!courses.length || !students.length || !lecturers.length) {
    throw new Error('Please ensure there are courses, students, and lecturers in the database');
  }

  const sampleData = [];
  const statuses = ['present', 'absent', 'late'];
  const today = new Date();

  // Generate attendance records for the last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    for (const student of students) {
      for (const course of courses) {
        sampleData.push({
          studentId: student._id,
          courseId: course._id,
          lecturerId: lecturers[Math.floor(Math.random() * lecturers.length)]._id,
          date: date,
          status: statuses[Math.floor(Math.random() * statuses.length)]
        });
      }
    }
  }

  // Clear existing records and insert new ones
  await this.deleteMany({});
  await this.insertMany(sampleData);
  
  return sampleData.length;
};

module.exports = mongoose.model("Attendance", AttendanceSchema);
