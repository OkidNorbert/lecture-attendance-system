// server/models/User.js
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: function() { return new mongoose.Types.ObjectId() },
    auto: true
  },
  first_name: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  last_name: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password_hash: {
    type: String,
    required: [true, 'Password is required']
  },
  role: {
    type: String,
    enum: ['student', 'lecturer', 'admin'],
    required: [true, 'Role is required']
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  isApproved: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  discriminatorKey: 'role'
});

// Add indexes for better query performance
userSchema.index({ role: 1 });
userSchema.index({ email: 1 }, { unique: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Create the base User model
const User = mongoose.model('User', userSchema);

// Student discriminator
const Student = User.discriminator('student', new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  program_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program'
  },
  student_id: {
    type: String,
    required: true,
    unique: true
  }
}));

// Lecturer discriminator
const Lecturer = User.discriminator('lecturer', new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lecturer_id: {
    type: String,
    required: true,
    unique: true
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }
}));

module.exports = { User, Student, Lecturer };
