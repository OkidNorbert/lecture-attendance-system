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

async function createSimpleUser() {
  try {
    console.log('Creating a simple user with a known password and hash...');
    
    // Create a very simple, known password hash 
    const simplePassword = 'password123';
    const simpleHash = await bcrypt.hash(simplePassword, 1); // Using a low cost factor for simplicity
    
    console.log(`Generated hash for '${simplePassword}': ${simpleHash}`);
    
    // Create/update the user
    let simpleUser = await User.findOne({ email: 'simple@test.com' });
    
    if (simpleUser) {
      console.log('Simple user already exists, updating password...');
      simpleUser.password = simpleHash;
      await simpleUser.save();
    } else {
      console.log('Creating new simple user...');
      simpleUser = new User({
        name: 'Simple Test',
        email: 'simple@test.com',
        password: simpleHash,
        role: 'admin',
        isApproved: true,
        isActive: true
      });
      await simpleUser.save();
    }
    
    console.log('Simple user credentials:');
    console.log('Email: simple@test.com');
    console.log('Password: password123');
    console.log('Hash: ' + simpleHash);
    
  } catch (error) {
    console.error('Error creating simple user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createSimpleUser(); 