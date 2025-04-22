const mongoose = require('mongoose');
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

async function createTestAccount() {
  try {
    // This is a hardcoded hash for the password "testing123"
    // Generated with: bcrypt.hashSync("testing123", 10)
    const hardcodedHash = '$2a$10$fSNJVZwE2mepNhUcL2tTaOwGccJ5iNwrQxR3zw8j4OBnPxHmL3nHC';
    
    // Check if test account already exists
    let testAccount = await User.findOne({ email: 'test@admin.com' });
    
    if (testAccount) {
      console.log('Test account already exists, updating password...');
      testAccount.password = hardcodedHash;
      await testAccount.save();
    } else {
      console.log('Creating new test account...');
      testAccount = new User({
        name: 'Test Account',
        email: 'test@admin.com',
        password: hardcodedHash,
        role: 'admin',
        isApproved: true,
        isActive: true
      });
      await testAccount.save();
    }
    
    console.log('Test account created with hardcoded password hash:');
    console.log('Email: test@admin.com');
    console.log('Password: testing123');
    console.log('Hash: ' + hardcodedHash);
    console.log('\nPlease try logging in with these credentials!');
    
  } catch (error) {
    console.error('Error creating test account:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createTestAccount(); 