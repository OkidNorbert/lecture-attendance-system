const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/your_database_name', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Log when the connection is lost
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB; 