const express = require('express');
const Contract = require('../models/Contract.cjs');
const Notification = require('../models/Notification.cjs');
const auth = require('../middleware/auth.cjs');
const { handleWebhook } = require('../utils/stripeHelper.cjs');

const router = express.Router();

// Stripe webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    await handleWebhook(req, res);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send('Webhook error');
  }
});

// Get payment history for user
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const contracts = await Contract.find({
      $or: [
        { clientId: req.user._id },
        { freelancerId: req.user._id }
      ],
      paymentStatus: { $in: ['paid', 'pending', 'failed'] }
    })
    .populate('jobId', 'title')
    .populate('clientId', 'name')
    .populate('freelancerId', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Contract.countDocuments({
      $or: [
        { clientId: req.user._id },
        { freelancerId: req.user._id }
      ],
      paymentStatus: { $in: ['paid', 'pending', 'failed'] }
    });

    res.json({
      success: true,
      data: {
        payments: contracts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalPayments: total
        }
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message
    });
  }
});

// Get payment stats for user
router.get('/stats', auth, async (req, res) => {
  try {
    let stats = {};

    if (req.user.role === 'client') {
      // Client payment stats
      const totalPaid = await Contract.aggregate([
        { $match: { clientId: req.user._id, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const pendingPayments = await Contract.countDocuments({
        clientId: req.user._id,
        paymentStatus: 'pending'
      });

      stats = {
        totalPaid: totalPaid[0]?.total || 0,
        pendingPayments,
        role: 'client'
      };
    } else {
      // Freelancer earning stats
      const totalEarned = await Contract.aggregate([
        { $match: { freelancerId: req.user._id, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const pendingEarnings = await Contract.aggregate([
        { $match: { freelancerId: req.user._id, paymentStatus: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      stats = {
        totalEarned: totalEarned[0]?.total || 0,
        pendingEarnings: pendingEarnings[0]?.total || 0,
        role: 'freelancer'
      };
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment stats',
      error: error.message
    });
  }
});

module.exports = router;