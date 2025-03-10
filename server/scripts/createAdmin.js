const mongoose = require('mongoose');
const User = require('../models/User');
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
    .then(() => console.log('MongoDB Atlas connected successfully'))
    .catch(err => {
        console.error('MongoDB Atlas connection error:', err);
        process.exit(1);
    });

async function createAdminUser() {
    try {
        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@example.com' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            mongoose.disconnect();
            return;
        }

        const adminUser = new User({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'n0bby@adm1n',
            role: 'admin'
        });

        await adminUser.save();
        console.log('Admin user created successfully');
    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

createAdminUser(); 