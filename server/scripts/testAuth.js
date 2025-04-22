const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
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

async function testAuthentication() {
  try {
    // Create a test user with a known password
    const password = 'testuser123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Check if test user already exists
    let testUser = await User.findOne({ email: 'testuser@example.com' });
    
    if (testUser) {
      console.log('Test user already exists, updating password...');
      testUser.password = hashedPassword;
      await testUser.save();
    } else {
      console.log('Creating new test user...');
      testUser = new User({
        name: 'Test User',
        email: 'testuser@example.com',
        password: hashedPassword,
        role: 'student',
        isApproved: true,
        isActive: true
      });
      await testUser.save();
    }
    
    console.log('Test user saved with hashed password:', hashedPassword);
    
    // Test password comparison
    console.log('\nTesting password comparison:');
    const isMatch = await bcrypt.compare(password, testUser.password);
    console.log(`Password comparison result: ${isMatch ? 'SUCCESS' : 'FAILURE'}`);
    
    // Test with wrong password
    const wrongMatch = await bcrypt.compare('wrongpassword', testUser.password);
    console.log(`Wrong password comparison result: ${wrongMatch ? 'FAILURE (matched)' : 'SUCCESS (did not match)'}`);
    
    console.log('\nTest User Credentials:');
    console.log('Email: testuser@example.com');
    console.log('Password: testuser123');
    
  } catch (error) {
    console.error('Error testing authentication:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testAuthentication(); 