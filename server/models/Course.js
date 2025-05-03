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
    trim: true,
    uppercase: true,
    validate: [
      {
        validator: function(v) {
          return v && v.trim().length > 0;
        },
        message: 'Course code cannot be empty'
      },
      {
        validator: function(v) {
          return v !== null;
        },
        message: 'Course code cannot be null'
      }
    ],
    set: function(v) {
      if (!v) return undefined; // This will trigger the required validator
      return v.trim().toUpperCase();
    }
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
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  description: {
    type: String,
    trim: true,
    default: ''
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
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create compound index for course_code and program_id
CourseSchema.index({ course_code: 1, program_id: 1 }, { unique: true });

// Pre-save middleware
CourseSchema.pre('save', function(next) {
  if (!this.course_code || this.course_code.trim() === '') {
    return next(new Error('Course code is required'));
  }
  
  this.course_code = this.course_code.trim().toUpperCase();
  next();
});

// Virtual for getting the program details
CourseSchema.virtual('program', {
  ref: 'Program',
  localField: 'program_id',
  foreignField: '_id',
  justOne: true
});

// Virtual for getting the department through program
CourseSchema.virtual('program_department', {
  ref: 'Program',
  localField: 'program_id',
  foreignField: '_id',
  justOne: true,
  options: { select: 'departmentId' }
});

// Virtual for getting the faculty through program
CourseSchema.virtual('program_faculty', {
  ref: 'Program',
  localField: 'program_id',
  foreignField: '_id',
  justOne: true,
  options: { select: 'facultyId' }
});

// Method to get full course details with populated relationships
CourseSchema.methods.getFullDetails = async function() {
  await this.populate([
    { path: 'program_id', select: 'name code facultyId departmentId' },
    { path: 'faculty', select: 'name code' },
    { path: 'department', select: 'name code' },
    { path: 'lecturers', select: 'name email role' },
    { path: 'students', select: 'name email role' }
  ]);
  
  return {
    ...this.toObject(),
    department: this.department || this.program_id?.departmentId,
    faculty: this.faculty || this.program_id?.facultyId,
    program: this.program_id
  };
};

module.exports = mongoose.model('Course', CourseSchema);