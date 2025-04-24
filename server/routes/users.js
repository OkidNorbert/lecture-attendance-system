const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get users with optional role filter
// @access  Private (All authenticated users)
router.get('/', protect, async (req, res) => {
  try {
    const { role } = req.query;
    const query = {};

    if (role) {
      query.role = role;
    }

    const users = await User.find(query).select('-password_hash');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 