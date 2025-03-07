// server/models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  studentId: { type: String, unique: true, sparse: true }, // For students
  role: { type: String, enum: ["student", "lecturer", "admin"], required: true },
  course: { type: String }, // Optional for lecturers
  year: { type: String },   // Optional for students
  semester: { type: String }, // Optional for students
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  isApproved: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
