const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Get MongoDB connection string from env
const connectionString = process.env.MONGODB_URI;

console.log('Attempting to connect to MongoDB Atlas...');
mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB Atlas connected successfully'))
  .catch(err => {
    console.error('MongoDB Atlas connection error:', err);
    process.exit(1);
  });

async function createBasicUser() {
  try {
    // Create a hard-coded, known bcrypt hash for "pass123"
    // This is a pre-computed hash, not generated at runtime
    const knownHash = '$2a$10$K5RUCSgcLX5IFQVHfLPsLuPSJVqme2r7eZCOZIgZ92j/SjTc1.1Uu';
    
    // Create or update the user
    let basicUser = await User.findOne({ email: 'basic@test.com' });
    
    if (basicUser) {
      console.log('Updating existing basic user...');
      basicUser.password = knownHash;
      await basicUser.save();
    } else {
      console.log('Creating new basic user...');
      basicUser = new User({
        name: 'Basic User',
        email: 'basic@test.com',
        password: knownHash,
        role: 'admin', // Make this an admin for easy testing
        isApproved: true,
        isActive: true
      });
      await basicUser.save();
    }
    
    console.log('Basic user credentials:');
    console.log('Email: basic@test.com');
    console.log('Password: pass123');
    console.log('Hash: ' + knownHash);
    
    // Now test if the compare function works with this hash
    const testResult = await bcrypt.compare('pass123', knownHash);
    console.log('Local bcrypt verification test: ' + (testResult ? 'PASSED ✅' : 'FAILED ❌'));
    
  } catch (error) {
    console.error('Error creating basic user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createBasicUser(); 