// server.js
require("dotenv").config(); // Load environment variables
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const attendanceRoutes = require("./routes/attendance");

// Import routes
const authRoutes = require("./routes/auth");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log('Request received:', {
        method: req.method,
        path: req.path,
        body: req.body,
        headers: req.headers
    });
    next();
});

//attendance
app.use("/api/attendance", attendanceRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("Lecture Attendance System Backend Running...");
});

// Authentication Routes
app.use("/api/auth", authRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Import QR Code routes
const qrRoutes = require("./routes/qrcode");

// Register QR Code Routes
app.use("/api/qrcode", qrRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
});
