require("dotenv").config(); // ✅ Load environment variables first
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const adminRoutes = require('./routes/admin');

// ✅ Debugging: Log MONGO_URI
console.log("MONGO_URI:", process.env.MONGO_URI);

// ✅ Ensure MongoDB URI is Defined
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is not defined in .env file");
  process.exit(1);
}

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173', // Your React app's URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Import routes
const authRoutes = require("./routes/auth");
const attendanceRoutes = require("./routes/attendance");
const qrRoutes = require("./routes/qrcode");

// ✅ Use routes
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/qrcode", qrRoutes);
app.use('/api/admin', adminRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("Lecture Attendance System Backend Running...");
});

// ✅ Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  }
};
connectDB();

// Test route
app.get('/test', (req, res) => {
  res.json({ message: "Server is running!" });
});

// ✅ Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
