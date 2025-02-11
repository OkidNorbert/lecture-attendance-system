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

//attendance
app.use("/api/attendance", attendanceRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("Lecture Attendance System Backend Running...");
});

// Authentication Routes
app.use("/api/auth", authRoutes);

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1); // Exit process with failure
  }
};

connectDB();

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Import QR Code routes
const qrRoutes = require("./routes/qrcode");

// Register QR Code Routes
app.use("/api/qrcode", qrRoutes);
