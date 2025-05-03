const mongoose = require('mongoose');

const ProgramSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Program name is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Program name must be at least 3 characters'],
    maxlength: [100, 'Program name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Program code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9]{3,10}$/, 'Program code must be 3-10 alphanumeric characters']
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
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  duration: {
    type: Number,
    required: [true, 'Program duration is required'],
    min: [1, 'Duration must be at least 1 year'],
    max: [6, 'Duration cannot exceed 6 years']
  },
  totalCredits: {
    type: Number,
    required: [true, 'Total credits is required'],
    min: [30, 'Total credits must be at least 30'],
    max: [300, 'Total credits cannot exceed 300']
  },
  courses: [{
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
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  statistics: {
    totalStudents: { type: Number, default: 0 },
    totalLecturers: { type: Number, default: 0 },
    totalCourses: { type: Number, default: 0 },
    averageGPA: { type: Number, default: 0 },
    graduationRate: { type: Number, default: 0 }
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

// Pre-save middleware to update statistics
ProgramSchema.pre('save', async function(next) {
  if (this.isModified('students')) {
    this.statistics.totalStudents = this.students.length;
  }
  if (this.isModified('lecturers')) {
    this.statistics.totalLecturers = this.lecturers.length;
  }
  if (this.isModified('courses')) {
    this.statistics.totalCourses = this.courses.length;
  }
  this.updatedAt = Date.now();
  next();
});

// Method to calculate program statistics
ProgramSchema.methods.calculateStatistics = async function() {
  // Make sure courses array exists and is non-empty
  if (!this.courses || this.courses.length === 0) {
    this.statistics.totalCourses = 0;
    this.statistics.averageGPA = 0;
  } else {
    this.statistics.totalCourses = this.courses.length;
    
    const grades = await mongoose.model('Grade').find({
      courseId: { $in: this.courses }
    });

    if (grades && grades.length > 0) {
      // Calculate average GPA
      const totalGPA = grades.reduce((sum, grade) => sum + grade.gpa, 0);
      this.statistics.averageGPA = totalGPA / grades.length;
    } else {
      this.statistics.averageGPA = 0;
    }
  }
  
  // Make sure students array exists and is non-empty
  if (!this.students || this.students.length === 0) {
    this.statistics.totalStudents = 0;
    this.statistics.graduationRate = 0;
  } else {
    this.statistics.totalStudents = this.students.length;
    
    // Calculate graduation rate if students exist
    const graduatedStudents = await mongoose.model('User').countDocuments({
      _id: { $in: this.students },
      status: 'graduated'
    });
    
    this.statistics.graduationRate = (graduatedStudents / this.students.length) * 100;
  }
  
  // Make sure lecturers array exists and is non-empty
  if (!this.lecturers || this.lecturers.length === 0) {
    this.statistics.totalLecturers = 0;
  } else {
    this.statistics.totalLecturers = this.lecturers.length;
  }

  await this.save();
};

// Virtual for getting full program details
ProgramSchema.virtual('fullDetails').get(function() {
  return {
    ...this.toObject(),
    facultyName: this.facultyId ? this.facultyId.name : '',
    departmentName: this.departmentId ? this.departmentId.name : '',
    coursesCount: this.courses ? this.courses.length : 0,
    lecturersCount: this.lecturers ? this.lecturers.length : 0,
    studentsCount: this.students ? this.students.length : 0
  };
});

// Index for better query performance
ProgramSchema.index({ code: 1, facultyId: 1, departmentId: 1 });
ProgramSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Program', ProgramSchema); 