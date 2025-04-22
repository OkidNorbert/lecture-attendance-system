const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
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

async function fixAdminAccount() {
  try {
    console.log('Checking admin account...');
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    
    // Check if admin exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    
    if (existingAdmin) {
      console.log('Admin account found, updating password...');
      existingAdmin.password = adminPassword;
      existingAdmin.isApproved = true;
      existingAdmin.isActive = true;
      await existingAdmin.save();
      console.log('Admin password updated successfully');
    } else {
      console.log('No admin account found, creating new admin account...');
      const admin = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        password: adminPassword,
        role: 'admin',
        isApproved: true,
        isActive: true
      });
      
      await admin.save();
      console.log('Admin account created successfully');
    }
    
    console.log('Admin credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error fixing admin account:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixAdminAccount(); 