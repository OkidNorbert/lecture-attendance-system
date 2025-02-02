const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  course: { type: String, required: true },
  date: { type: String, required: true },
  sessionId: { type: String, required: true, unique: true },
}, { timestamps: true });

module.exports = mongoose.model("Attendance", AttendanceSchema);
