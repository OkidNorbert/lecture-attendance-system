const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: function() { return new mongoose.Types.ObjectId() },
    auto: true
  },
  course_code: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  course_name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true
  },
  program_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: [true, 'Program is required']
  },
  description: {
    type: String,
    trim: true
  },
  credits: {
    type: Number,
    required: [true, 'Credits are required'],
    min: [1, 'Credits must be at least 1'],
    max: [25, 'Credits cannot exceed 25']
  },
  semester: {
    type: String,
    required: [true, 'Semester is required'],
    trim: true
  },
  programYear: {
    type: Number,
    required: [true, 'Program year is required'],
    min: [1, 'Program year must be at least 1'],
    max: [6, 'Program year cannot exceed 6']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  lecturers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' 
  }],
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
CourseSchema.index({ program_id: 1 });
CourseSchema.index({ course_code: 1 }, { unique: true });

// Pre-save middleware
CourseSchema.pre('save', function(next) {
  this.course_code = this.course_code.toUpperCase();
  next();
});

// Virtual for getting the department and faculty through program
CourseSchema.virtual('department', {
  ref: 'Program',
  localField: 'program_id',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Course', CourseSchema);