// server/models/User.js
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  studentId: { type: String, unique: true, sparse: true }, // For students
  role: { type: String, enum: ["student", "lecturer", "admin", "department_head"], required: true },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: function() {
      return this.role !== 'admin'; // Department is required only for non-admin users
    }
  },
  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: function() {
      return this.role === 'student';
    }
  },
  course: { type: String }, // Optional for lecturers
  year: { type: String },   // Optional for students
  semester: { type: String }, // Optional for students
  courses: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program'
    }
  }],
  isApproved: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("User", userSchema);
