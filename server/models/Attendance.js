const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  attendance_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: function() { return new mongoose.Types.ObjectId() },
    auto: true
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required']
  },
  attendance_date: {
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
AttendanceSchema.index({ course_id: 1, attendance_date: 1 });

// Add compound index for unique attendance per student per course per date
AttendanceSchema.index({ 
  student_id: 1, 
  course_id: 1, 
  attendance_date: 1 
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

  if (!courses.length || !students.length) {
    throw new Error('Please ensure there are courses and students in the database');
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
          student_id: student._id,
          course_id: course._id,
          attendance_date: date,
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
