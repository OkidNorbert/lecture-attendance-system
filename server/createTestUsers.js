const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Admin credentials
const admin = {
  name: 'Admin User',
  email: 'admin@attendancedb.com',
  password: 'admin@2*',
  role: 'admin'
};

// Lecturer credentials
const lecturer = {
  name: 'Test Lecturer',
  email: 'lecturer@attendancedb.com',
  password: 'lecturer@123',
  role: 'lecturer'
};

// Student credentials
const student = {
  name: 'Test Student',
  email: 'student@attendancedb.com',
  password: 'student@123',
  role: 'student'
};

async function createUsers() {
  try {
    console.log('Attempting to create users via API...');
    
    // Try to register admin
    try {
      const adminResponse = await axios.post(`${API_URL}/auth/register`, admin);
      console.log('Admin registration response:', adminResponse.data);
    } catch (error) {
      console.log('Admin registration failed (might already exist):', error.response?.data?.msg || error.message);
    }
    
    // Try to register lecturer
    try {
      const lecturerResponse = await axios.post(`${API_URL}/auth/register`, lecturer);
      console.log('Lecturer registration response:', lecturerResponse.data);
    } catch (error) {
      console.log('Lecturer registration failed (might already exist):', error.response?.data?.msg || error.message);
    }
    
    // Try to register student
    try {
      const studentResponse = await axios.post(`${API_URL}/auth/register`, student);
      console.log('Student registration response:', studentResponse.data);
    } catch (error) {
      console.log('Student registration failed (might already exist):', error.response?.data?.msg || error.message);
    }
    
    console.log('\nTest User Credentials:');
    console.log('-------------------------');
    console.log('Admin:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('\nLecturer:');
    console.log('Email: lecturer@example.com');
    console.log('Password: lecturer123');
    console.log('\nStudent:');
    console.log('Email: student@example.com');
    console.log('Password: student123');
    
  } catch (error) {
    console.error('Error creating users:', error);
  }
}

createUsers(); 