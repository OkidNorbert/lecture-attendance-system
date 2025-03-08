const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  duration: {
    type: Number, // Number of years
    required: true
  },
  description: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Program', programSchema); 