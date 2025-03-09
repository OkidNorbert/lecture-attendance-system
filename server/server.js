require("dotenv").config(); // ✅ Load environment variables first
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const adminRoutes = require('./routes/admin');
const trendsRoutes = require('./routes/trends');
const http = require('http');
const setupWebSocket = require('./websocket');

// ✅ Debugging: Log MONGO_URI
console.log("MONGODB_URI:", process.env.MONGODB_URI);

// ✅ Ensure MongoDB URI is Defined
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGO_URI is not defined in .env file");
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const wss = setupWebSocket(server);

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
app.use('/api/attendance/trends', trendsRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("Lecture Attendance System Backend Running...");
});

// ✅ Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1); // Exit process with failure
  }
};
connectDB();

// Test route
app.get('/test', (req, res) => {
  res.json({ message: "Server is running!" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ msg: 'Something broke!' });
});

// ✅ Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});
