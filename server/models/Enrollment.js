const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required'],
    validate: {
      validator: async function(userId) {
        const user = await mongoose.model('User').findById(userId);
        return user && user.role === 'student';
      },
      message: 'Invalid student'
    }
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  lecturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Lecturer is required'],
    validate: {
      validator: async function(userId) {
        const user = await mongoose.model('User').findById(userId);
        return user && user.role === 'lecturer';
      },
      message: 'Invalid lecturer'
    }
  },
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: [true, 'Program is required']
  },
  semester: {
    type: String,
    required: [true, 'Semester is required']
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
  },
  status: {
    type: String,
    enum: ['enrolled', 'dropped', 'completed'],
    default: 'enrolled'
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure unique enrollment for student in a course
EnrollmentSchema.index({ studentId: 1, courseId: 1, semester: 1, academicYear: 1 }, { unique: true });

// Pre-save middleware to update lastModified
EnrollmentSchema.pre('save', function(next) {
  this.lastModified = Date.now();
  next();
});

// Virtual for getting student details
EnrollmentSchema.virtual('student', {
  ref: 'User',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true
});

// Virtual for getting course details
EnrollmentSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true
});

// Virtual for getting lecturer details
EnrollmentSchema.virtual('lecturer', {
  ref: 'User',
  localField: 'lecturerId',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Enrollment', EnrollmentSchema); 