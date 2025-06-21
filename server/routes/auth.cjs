const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User.cjs');
const auth = require('../middleware/auth.cjs');
const Job = require('../models/Job.cjs');
const Contract = require('../models/Contract.cjs');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  });
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, bio, skills, hourlyRate, location } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
      bio,
      skills: skills || [],
      hourlyRate,
      location
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update online status
    await user.updateOnlineStatus(true);

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// Verify token
router.get('/verify', auth, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});

// Get profile
router.get('/profile', auth, (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = ['name', 'bio', 'skills', 'hourlyRate', 'location', 'portfolio'];
    
    // Filter only allowed updates
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      filteredUpdates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Profile update failed',
      error: error.message
    });
  }
});

// Logout (update online status)
router.post('/logout', auth, async (req, res) => {
  try {
    await req.user.updateOnlineStatus(false);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
});

// Analytics endpoint (admin only for now)
router.get('/analytics', auth, async (req, res) => {
  try {
    // Optionally, restrict to admin users only
    // if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
    const now = new Date();
    const weeks = Array.from({ length: 6 }, (_, i) => {
      const start = new Date(now);
      start.setDate(now.getDate() - (6 - i) * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      return { start, end };
    });
    // Jobs per week
    const jobsPerWeek = await Promise.all(
      weeks.map(({ start, end }) =>
        Job.countDocuments({ createdAt: { $gte: start, $lt: end } })
      )
    );
    // Revenue per week
    const revenuePerWeek = await Promise.all(
      weeks.map(({ start, end }) =>
        Contract.aggregate([
          { $match: { paymentStatus: 'paid', createdAt: { $gte: start, $lt: end } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).then(r => r[0]?.total || 0)
      )
    );
    // User signups per week
    const signupsPerWeek = await Promise.all(
      weeks.map(({ start, end }) =>
        User.countDocuments({ createdAt: { $gte: start, $lt: end } })
      )
    );
    const [userCount, jobCount, contractCount, activeUsers, jobsThisWeek, revenue, paidContracts] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Contract.countDocuments(),
      User.countDocuments({ isOnline: true }),
      Job.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) } }),
      Contract.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } }, },
      ]),
      Contract.countDocuments({ paymentStatus: 'paid' })
    ]);
    const totalRevenue = Array.isArray(revenue) ? (revenue[0]?.total || 0) : 0;
    const averageContractValue = paidContracts > 0 ? (totalRevenue / paidContracts) : 0;
    res.json({
      success: true,
      data: {
        users: userCount,
        jobs: jobCount,
        contracts: contractCount,
        activeUsers,
        jobsThisWeek,
        revenue: totalRevenue,
        averageContractValue,
        jobsPerWeek,
        revenuePerWeek,
        signupsPerWeek,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch analytics', error: error.message });
  }
});

module.exports = router;