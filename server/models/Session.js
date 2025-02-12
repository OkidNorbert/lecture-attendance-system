const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  course: { type: String, required: true },
  expiryTime: { type: Date, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  radius: { type: Number, required: true },
});

module.exports = mongoose.model("Session", SessionSchema);
