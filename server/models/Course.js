const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
    minlength: [3, 'Course name must be at least 3 characters'],
    maxlength: [100, 'Course name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9]{3,10}$/, 'Course code must be 3-10 alphanumeric characters']
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: [true, 'Faculty is required']
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: [true, 'Program is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  credits: {
    type: Number,
    required: [true, 'Credits are required'],
    min: [1, 'Credits must be at least 1'],
    max: [6, 'Credits cannot exceed 6']
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  lecturers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: async function(userId) {
        const user = await mongoose.model('User').findById(userId);
        return user && user.role === 'lecturer';
      },
      message: 'Invalid lecturer'
    }
  }],
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: async function(userId) {
        const user = await mongoose.model('User').findById(userId);
        return user && user.role === 'student';
      },
      message: 'Invalid student'
    }
  }],
  semester: {
    type: String,
    enum: ['Fall', 'Spring', 'Summer'],
    required: [true, 'Semester is required']
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
CourseSchema.index({ code: 1 }, { unique: true });
CourseSchema.index({ facultyId: 1, departmentId: 1, programId: 1 });
CourseSchema.index({ name: 'text', description: 'text' });

// Virtual for getting full course details
CourseSchema.virtual('fullDetails').get(function() {
  return {
    ...this.toObject(),
    facultyName: this.facultyId ? this.facultyId.name : '',
    departmentName: this.departmentId ? this.departmentId.name : '',
    programName: this.programId ? this.programId.name : '',
    prerequisiteCount: this.prerequisites ? this.prerequisites.length : 0,
    lecturerCount: this.lecturers ? this.lecturers.length : 0,
    studentCount: this.students ? this.students.length : 0
  };
});

// Pre-save middleware
CourseSchema.pre('save', function(next) {
  this.code = this.code.toUpperCase();
  this.updatedAt = Date.now();
  next();
});

// Enable virtuals in JSON
CourseSchema.set('toJSON', { virtuals: true });
CourseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Course', CourseSchema);