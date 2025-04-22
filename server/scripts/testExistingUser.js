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

async function testExistingUser() {
  try {
    // Test all existing users
    const users = await User.find({});
    
    for (const user of users) {
      console.log(`\nTesting user: ${user.email} (${user.role})`);
      console.log(`Password hash: ${user.password}`);
      
      // Try different common passwords
      const passwords = ['admin123', 'password123', 'test123', 'lecturer123', 'student123'];
      
      for (const password of passwords) {
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`Password '${password}' match result: ${isMatch ? 'MATCHED ✅' : 'Failed ❌'}`);
      }
    }
    
    // Create a new user with known password for testing
    console.log('\nCreating new test user with known password...');
    const testPassword = 'newtest123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testPassword, salt);
    
    // Save as a new user or update existing
    let testUser = await User.findOne({ email: 'newtest@example.com' });
    if (testUser) {
      testUser.password = hashedPassword;
      await testUser.save();
    } else {
      testUser = new User({
        name: 'New Test User',
        email: 'newtest@example.com',
        password: hashedPassword,
        role: 'student',
        isApproved: true,
        isActive: true
      });
      await testUser.save();
    }
    
    // Try to log in with this user
    console.log(`New test user created with email: newtest@example.com and password: ${testPassword}`);
    console.log(`Hashed password: ${testUser.password}`);
    
    const verifyMatch = await bcrypt.compare(testPassword, testUser.password);
    console.log(`Verification result: ${verifyMatch ? 'SUCCESS ✅' : 'FAILURE ❌'}`);
    
  } catch (error) {
    console.error('Error testing existing users:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testExistingUser(); 