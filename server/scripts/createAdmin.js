const { User } = require('../models/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not defined in environment variables');
    process.exit(1);
}

console.log('Attempting to connect to MongoDB...');
// Log URI without password for debugging
const sanitizedUri = process.env.MONGODB_URI.replace(/:([^@]+)@/, ':****@');
console.log('Using connection string:', sanitizedUri);

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

async function createAdminUser() {
    try {
        // Check if admin already exists
        const adminExists = await User.findOne({ email: 'admin@example.com' });
        
        if (adminExists) {
            console.log('Admin already exists');
            process.exit(0);
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        // Create admin user
        const admin = new User({
            first_name: 'Admin',
            last_name: 'User',
            email: 'admin@example.com',
            password_hash: hashedPassword,
            role: 'admin',
            isApproved: true
        });
        
        await admin.save();
        console.log('Admin user created successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error creating admin:', err);
        process.exit(1);
    }
}

createAdminUser(); 