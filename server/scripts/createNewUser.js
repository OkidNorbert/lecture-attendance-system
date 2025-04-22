const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.MONGODB_URI;

console.log('Connecting to MongoDB Atlas with URI:', connectionString.replace(/:([^@]+)@/, ':****@'));

mongoose.connect(connectionString)
  .then(() => console.log('MongoDB Atlas connected successfully'))
  .catch(err => {
    console.error('MongoDB Atlas connection error:', err);
    process.exit(1);
  });

async function createUser() {
  try {
    // Define user details
    const users = [
      {
        name: 'Admin Test',
        email: 'admin@test.com',
        password: 'admin123',
        role: 'admin',
      },
      {
        name: 'Lecturer Test',
        email: 'lecturer@test.com',
        password: 'lecturer123',
        role: 'lecturer',
      },
      {
        name: 'Student Test',
        email: 'student@test.com',
        password: 'student123',
        role: 'student',
      }
    ];

    console.log('Creating test users...');
    
    for (const userData of users) {
      console.log(`Processing user: ${userData.name} (${userData.email})`);
      
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`User ${userData.email} already exists, updating...`);
        
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        
        // Update user
        existingUser.password = hashedPassword;
        existingUser.isApproved = true;
        existingUser.isActive = true;
        await existingUser.save();
        
        console.log(`User ${userData.email} updated successfully`);
      } else {
        console.log(`Creating new user: ${userData.email}`);
        
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        
        // Create new user
        const newUser = new User({
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          isApproved: true,
          isActive: true
        });
        
        await newUser.save();
        console.log(`User ${userData.email} created successfully`);
      }
      
      // Verify the password works
      const storedUser = await User.findOne({ email: userData.email });
      if (storedUser) {
        const isMatch = await bcrypt.compare(userData.password, storedUser.password);
        console.log(`Password verification for ${userData.email}: ${isMatch ? 'SUCCESS ✅' : 'FAILED ❌'}`);
      }
    }
    
    console.log('\nTest User Credentials:');
    console.log('-------------------------');
    console.log('Admin:');
    console.log('Email: admin@test.com');
    console.log('Password: admin123');
    console.log('\nLecturer:');
    console.log('Email: lecturer@test.com');
    console.log('Password: lecturer123');
    console.log('\nStudent:');
    console.log('Email: student@test.com');
    console.log('Password: student123');
    
  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createUser(); 