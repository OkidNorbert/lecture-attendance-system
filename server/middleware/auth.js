const jwt = require('jsonwebtoken');
require('dotenv').config();

// Protect middleware - verifies JWT token
const protect = function(req, res, next) {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('🔒 Auth Check - Incoming request to:', req.method, req.path);
    console.log('🔑 Token:', token ? 'Present' : 'Missing');

    // Check if no token
    if (!token) {
      console.log('⛔ No token provided');
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('📝 Raw token payload:', decoded);
    
    // Handle compatibility with older tokens that may use id instead of _id
    if (decoded.id && !decoded._id) {
      console.log('ℹ️ Converting legacy id to _id');
      decoded._id = decoded.id;
    }
    
    // Ensure role is normalized
    if (decoded.role) {
      const originalRole = decoded.role;
      // Make admin roles consistent
      if (typeof decoded.role === 'string' && decoded.role.toLowerCase() === 'admin') {
        decoded.role = 'admin';
      }
      if (originalRole !== decoded.role) {
        console.log(`ℹ️ Normalized role from "${originalRole}" to "${decoded.role}"`);
      }
    }
    
    // Add user from payload
    req.user = decoded;
    
    console.log('✅ User authenticated:', { 
      id: req.user._id, 
      role: req.user.role, 
      method: req.method,
      endpoint: req.path
    });
    
    next();
  } catch (err) {
    console.error('❌ Auth middleware error:', err);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Authorize middleware - checks if user has required role
const authorize = (...roleArgs) => {
  return (req, res, next) => {
    if (!req.user) {
      console.log('Authorization failed: No user in request');
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Flatten role arguments in case an array was passed
    const roles = roleArgs.flat();

    console.log(`Authorization check: User role ${req.user.role}, Required roles: [${roles.join(', ')}]`);
    
    // Special handling for admin role - always allow admin access
    if (req.user.role === 'admin' || req.user.role.toLowerCase() === 'admin') {
      console.log('Admin role detected - granting full access');
      return next();
    }
    
    // Check role case-insensitively
    const userRoleLower = req.user.role.toLowerCase();
    const allowedRolesLower = roles.map(r => r.toLowerCase());
    
    if (!allowedRolesLower.includes(userRoleLower)) {
      console.log(`Access denied: User role ${req.user.role} not in allowed roles [${roles.join(', ')}]`);
      return res.status(403).json({ msg: 'Access denied' });
    }

    console.log(`Authorization successful: User role ${req.user.role} is authorized`);
    next();
  };
};

module.exports = { protect, authorize };
