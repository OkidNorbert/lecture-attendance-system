require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require('./config/db');
const http = require('http');
const setupWebSocket = require('./websocket');

// Import routes
const routes = {
  auth: require("./routes/auth"),
  attendance: require("./routes/attendance"),
  qr: require("./routes/qrcode"),
  admin: require('./routes/admin'),
  trends: require('./routes/trends'),
  courses: require('./routes/courses'),
  enrollments: require('./routes/enrollment'),
  users: require('./routes/users'),
  programs: require('./routes/programs')
};

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const notFoundHandler = require('./middleware/notFoundHandler');

const app = express();
const server = http.createServer(app);
const wss = setupWebSocket(server);

// Middleware setup
app.use(cors({
  origin: '*', // Allow all origins during development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(requestLogger);

// Route setup
app.use("/api/auth", routes.auth);
app.use('/api/admin', routes.admin);
app.use('/api/trends', routes.trends);
app.use("/api/attendance", routes.attendance);
app.use("/api/qrcode", routes.qr);
app.use('/api/courses', routes.courses);
app.use('/api/enrollments', routes.enrollments);
app.use('/api/users', routes.users);
app.use('/api/programs', routes.programs);

// Base route
app.get("/", (req, res) => {
  res.send("Lecture Attendance System Backend Running...");
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Connect and start server
const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => process.exit(1));
});
