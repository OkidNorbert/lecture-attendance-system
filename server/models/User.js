// server/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  studentId: { type: String, unique: true, sparse: true }, // For students
  role: { type: String, enum: ["student", "lecturer", "admin", "department_head"], required: true },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
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

module.exports = mongoose.model("User", userSchema);
