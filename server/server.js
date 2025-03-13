require("dotenv").config(); // ✅ Load environment variables first
const express = require("express");
const cors = require("cors");
const connectDB = require('./config/db');
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
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Add headers middleware
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Add request logging for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

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

// Connect to MongoDB
connectDB();

// Test route
app.get('/test', (req, res) => {
  res.json({ msg: 'Server is running' });
});

// Error handling middleware at the end
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    msg: 'Server Error', 
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Add this to handle routes that aren't found
app.use((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(404).json({ msg: 'Route not found' });
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
