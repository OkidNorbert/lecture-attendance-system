const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Ensure User model is imported

<<<<<<< HEAD
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user from payload
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
=======
module.exports = async function (req, res, next) {
  const token = req.header("Authorization");

  if (!token || !token.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "❌ Access denied, no valid token provided" });
  }
>>>>>>> parent of a3b2449 (admin page)

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);

    // ✅ Fetch full user details from database (excluding password)
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ msg: "❌ Invalid token. User not found" });
    }

    req.user = user; // ✅ Attach user details to the request
    next();
  } catch (err) {
    res.status(401).json({ msg: "❌ Invalid or expired token" });
  }
};
