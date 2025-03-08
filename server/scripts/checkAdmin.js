const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Atlas connected successfully'))
    .catch(err => {
        console.error('MongoDB Atlas connection error:', err);
        process.exit(1);
    });

async function checkAdminUser() {
    try {
        const adminUser = await User.findOne({ role: 'admin' });
        if (adminUser) {
            console.log('Admin user details:');
            console.log('Name:', adminUser.name);
            console.log('Email:', adminUser.email);
            console.log('Role:', adminUser.role);
        } else {
            console.log('No admin user found');
        }
    } catch (error) {
        console.error('Error checking admin user:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkAdminUser(); 