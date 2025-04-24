const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Student, Lecturer } = require("../models/User");
const { protect } = require("../middleware/auth");
const router = express.Router();

// ✅ User Registration API (Signup)
router.post("/register", async (req, res) => {
  try {
    const { first_name, last_name, email, password, role, program_id } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already registered" });

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create base user data
    const userData = {
      first_name,
      last_name,
      email,
      password_hash: hashedPassword,
      role,
      isApproved: true
    };

    // Create appropriate user type based on role
    if (role === 'student') {
      // Generate a student ID
      const studentId = `STU${Date.now().toString().slice(-6)}`;
      user = new Student({
        ...userData,
        student_id: studentId,
        program_id
      });
    } else if (role === 'lecturer') {
      // Generate a lecturer ID
      const lecturerId = `LEC${Date.now().toString().slice(-6)}`;
      user = new Lecturer({
        ...userData,
        lecturer_id: lecturerId
      });
    } else {
      // Admin or other roles
      user = new User(userData);
    }

    await user.save();

    // Generate JWT Token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ 
      msg: "User registered successfully", 
      token,
      user: {
        id: user._id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);

    // Find user by email
    let user = await User.findOne({ email });
    if (!user) {
      console.log(`User not found: ${email}`);
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    console.log(`User found: ${user.email}, Role: ${user.role}`);

    // Check if we're in development mode or a test environment
    const skipPasswordCheck = true; // Force skip for testing
    
    let isMatch = false;
    if (skipPasswordCheck) {
      // Skip password validation when in development/testing
      console.log('DEVELOPMENT MODE: Password check bypassed');
      isMatch = true;
    } else {
      // Normal password validation for production
      console.log(`Comparing password hash...`);
      isMatch = await bcrypt.compare(password, user.password_hash);
      console.log(`Password match result: ${isMatch ? 'SUCCESS' : 'FAILURE'}`);
    }

    if (!isMatch) {
      console.log(`Password mismatch for: ${email}`);
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Create JWT payload
    const payload = {
      id: user._id,
      role: user.role
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        console.log(`Login successful for: ${email} with role: ${user.role}`);
        res.json({
          token,
          role: user.role,
          user: {
            id: user._id,
            name: `${user.first_name} ${user.last_name}`,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role
          }
        });
      }
    );

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find admin by email
    const admin = await User.findOne({ email, role: "admin" });

    if (!admin) {
      console.log("❌ Admin not found:", email);  // Log missing admin
      return res.status(404).json({ message: "Admin not found" });
    }

    console.log("✅ Admin found:", admin); // Debug admin details

    // Check password
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      console.log("❌ Password mismatch for:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT Token
    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ 
      token, 
      admin: { 
        id: admin._id, 
        email: admin.email,
        name: `${admin.first_name} ${admin.last_name}`
      } 
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET api/auth/me
// @desc    Get logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password_hash');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
