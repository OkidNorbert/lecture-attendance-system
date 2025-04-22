const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Get MongoDB connection string from env
const connectionString = process.env.MONGODB_URI;

console.log('Attempting to connect to MongoDB Atlas...');
// Log URI without password for debugging
const sanitizedUri = connectionString.replace(/:([^@]+)@/, ':****@');
console.log('Using connection string:', sanitizedUri);

mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB Atlas connected successfully'))
  .catch(err => {
    console.error('MongoDB Atlas connection error:', err);
    process.exit(1);
  });

async function checkUsers() {
  try {
    console.log('Retrieving all users from database...');
    
    const users = await User.find({});
    
    if (users.length === 0) {
      console.log('No users found in the database');
    } else {
      console.log(`Found ${users.length} users in the database:`);
      users.forEach(user => {
        console.log(`
ID: ${user._id}
Name: ${user.name}
Email: ${user.email}
Role: ${user.role}
Password Hash (first 20 chars): ${user.password.substring(0, 20)}...
Approved: ${user.isApproved}
Active: ${user.isActive}
Created At: ${user.createdAt}
-----------------------------------`);
      });
    }
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkUsers(); 