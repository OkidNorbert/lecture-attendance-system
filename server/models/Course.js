const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  year: {
    type: String,
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  programs: [{
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program'
    },
    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  students: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program'
    }
  }]
}, {
  timestamps: true
});

// Compound index to ensure unique course code per department
courseSchema.index({ code: 1, department: 1 }, { unique: true });

module.exports = mongoose.model('Course', courseSchema); 