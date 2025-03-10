const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema({
  lecturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  program: {
    type: String,
    required: true
  },
  totalStudents: {
    type: Number,
    default: 0
  },
  presentCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  attendees: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    checkInTime: Date,
    status: {
      type: String,
      enum: ['present', 'late', 'absent'],
      default: 'absent'
    },
    location: {
      latitude: Number,
      longitude: Number
    }
  }],
  location: {
    latitude: Number,
    longitude: Number
  },
  radius: {
    type: Number,
    default: 50 // radius in meters
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Session", SessionSchema);
