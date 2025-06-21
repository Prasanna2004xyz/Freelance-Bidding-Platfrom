const express = require('express');
const User = require('../models/User.cjs');
const auth = require('../middleware/auth.cjs');

const router = express.Router();

// Middleware to check admin
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
  }
  next();
}

// List all users
router.get('/users', auth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password -emailVerificationToken -passwordResetToken -passwordResetExpires');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
});

// Ban a user
router.put('/users/:id/ban', auth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { banned: true }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User banned', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to ban user', error: error.message });
  }
});

// Unban a user
router.put('/users/:id/unban', auth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { banned: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User unbanned', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to unban user', error: error.message });
  }
});

module.exports = router; 