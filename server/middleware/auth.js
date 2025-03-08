const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Ensure User model is imported

module.exports = (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  console.log('Received token:', token ? 'Token present' : 'No token');

  // Check if no token
  if (!token) {
    console.log('Authorization denied: No token provided');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token payload:', {
      id: decoded.id,
      role: decoded.role
    });
    
    req.user = decoded;
    next();
  } catch (err) {
    console.log('Token verification failed:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
