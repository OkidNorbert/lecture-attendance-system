const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Ensure User model is imported

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ msg: "❌ No auth token found" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: "❌ Token is invalid" });
  }
};

module.exports = authMiddleware;
