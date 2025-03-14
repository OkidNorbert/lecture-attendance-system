const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('Incoming request to:', req.path);
    console.log('Token:', token ? 'Present' : 'Missing');

    // Check if no token
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user from payload
    req.user = decoded;
    
    console.log('User role:', req.user.role);
    
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
