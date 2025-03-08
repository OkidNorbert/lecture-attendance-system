const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Atlas connected successfully'))
    .catch(err => {
        console.error('MongoDB Atlas connection error:', err);
        process.exit(1);
    });

async function updateAdminPassword() {
    try {
        const newPassword = 'admin123'; // You can change this
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const adminUser = await User.findOneAndUpdate(
            { role: 'admin' },
            { $set: { password: hashedPassword } },
            { new: true }
        );

        if (adminUser) {
            console.log('Admin password updated successfully');
            console.log('New login credentials:');
            console.log('Email:', adminUser.email);
            console.log('Password: admin@n0bby');
        } else {
            console.log('No admin user found');
        }
    } catch (error) {
        console.error('Error updating admin password:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

updateAdminPassword(); 