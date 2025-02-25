const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  course: { type: String, required: true },
  date: { type: String, required: true }, // Keep only the date (YYYY-MM-DD)
  sessionId: { type: String, required: true },
  studentLat: { type: Number, required: true },
  studentLon: { type: Number, required: true },
  timestamp: { type: String, required: true } // ✅ New field for exact time
});

module.exports = mongoose.model("Attendance", AttendanceSchema);
