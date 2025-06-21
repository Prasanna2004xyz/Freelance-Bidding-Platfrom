const express = require('express');
const Bid = require('../models/Bid.cjs');
const Job = require('../models/Job.cjs');
const User = require('../models/User.cjs');
const Notification = require('../models/Notification.cjs');
const auth = require('../middleware/auth.cjs');
const { generateProposal } = require('../utils/aiHelper.cjs');
const { sendMail } = require('../utils/mail.cjs');

const router = express.Router();

// Get all bids for a job (job owner only)
router.get('/job/:jobId', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const bids = await Bid.find({ jobId: req.params.jobId })
      .populate('freelancerId', 'name rating completedProjects avatar skills location')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bids
    });
  } catch (error) {
    console.error('Get job bids error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bids',
      error: error.message
    });
  }
});

// Get freelancer's bids
router.get('/freelancer', auth, async (req, res) => {
  try {
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { page = 1, limit = 10, status } = req.query;
    const filter = { freelancerId: req.user._id };
    
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const bids = await Bid.find(filter)
      .populate('jobId', 'title status budget deadline clientId')
      .populate({
        path: 'jobId',
        populate: {
          path: 'clientId',
          select: 'name rating completedProjects'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Bid.countDocuments(filter);

    res.json({
      success: true,
      data: {
        bids,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalBids: total
        }
      }
    });
  } catch (error) {
    console.error('Get freelancer bids error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bids',
      error: error.message
    });
  }
});

// Submit a bid (freelancers only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({
        success: false,
        message: 'Only freelancers can submit bids'
      });
    }

    const { jobId, amount, proposal, timeline, aiGenerated, originalProposal } = req.body;

    // Check if job exists and is open
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Job is no longer accepting bids'
      });
    }

    // Check if freelancer already bid on this job
    const existingBid = await Bid.findOne({ jobId, freelancerId: req.user._id });
    if (existingBid) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a bid for this job'
      });
    }

    // Create bid
    const bid = new Bid({
      jobId,
      freelancerId: req.user._id,
      amount,
      proposal,
      timeline,
      aiGenerated: aiGenerated || false,
      originalProposal: originalProposal || null
    });

    await bid.save();

    // Increment job proposals count
    await job.incrementProposals();

    // Create notification for job owner
    const notification = new Notification({
      userId: job.clientId,
      type: 'bid_received',
      title: 'New Bid Received',
      message: `${req.user.name} submitted a bid for "${job.title}"`,
      data: {
        jobId: job._id,
        bidId: bid._id,
        freelancerId: req.user._id
      },
      actionUrl: `/job/${job._id}/bids`
    });

    await notification.save();

    // Send email notification to job poster
    try {
      const client = await User.findById(job.clientId);
      if (client && client.email) {
        await sendMail({
          to: client.email,
          subject: `New Bid on Your Job: ${job.title}`,
          text: `${req.user.name} submitted a bid of $${amount} for your job "${job.title}".\n\nView the bid: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-jobs`,
          html: `<p><strong>${req.user.name}</strong> submitted a bid of <strong>$${amount}</strong> for your job "${job.title}".</p><p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-jobs">View the bid</a></p>`
        });
      }
    } catch (e) {
      console.error('Failed to send bid email notification:', e);
    }

    // Populate bid data for response
    const populatedBid = await Bid.findById(bid._id)
      .populate('freelancerId', 'name rating completedProjects avatar')
      .populate('jobId', 'title budget deadline');

    res.status(201).json({
      success: true,
      message: 'Bid submitted successfully',
      data: populatedBid
    });
  } catch (error) {
    console.error('Submit bid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit bid',
      error: error.message
    });
  }
});

// Accept a bid (job owner only)
router.put('/:bidId/accept', auth, async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.bidId)
      .populate('jobId')
      .populate('freelancerId');

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    if (bid.jobId.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (bid.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Bid is no longer available'
      });
    }

    // Update bid status
    bid.status = 'accepted';
    await bid.save();

    // Update job status and selected bid
    bid.jobId.status = 'in_progress';
    bid.jobId.selectedBid = bid._id;
    await bid.jobId.save();

    // Reject all other bids for this job
    await Bid.updateMany(
      { jobId: bid.jobId._id, _id: { $ne: bid._id } },
      { status: 'rejected' }
    );

    // Create notification for freelancer
    const notification = new Notification({
      userId: bid.freelancerId._id,
      type: 'bid_accepted',
      title: 'Bid Accepted!',
      message: `Your bid for "${bid.jobId.title}" has been accepted`,
      data: {
        jobId: bid.jobId._id,
        bidId: bid._id,
        clientId: req.user._id
      },
      actionUrl: `/contract/${bid.jobId._id}`
    });

    await notification.save();

    res.json({
      success: true,
      message: 'Bid accepted successfully',
      data: bid
    });
  } catch (error) {
    console.error('Accept bid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept bid',
      error: error.message
    });
  }
});

// Reject a bid (job owner only)
router.put('/:bidId/reject', auth, async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.bidId)
      .populate('jobId')
      .populate('freelancerId');

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    if (bid.jobId.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (bid.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Bid cannot be rejected'
      });
    }

    // Update bid status
    bid.status = 'rejected';
    await bid.save();

    // Create notification for freelancer
    const notification = new Notification({
      userId: bid.freelancerId._id,
      type: 'bid_rejected',
      title: 'Bid Not Selected',
      message: `Your bid for "${bid.jobId.title}" was not selected`,
      data: {
        jobId: bid.jobId._id,
        bidId: bid._id,
        clientId: req.user._id
      }
    });

    await notification.save();

    res.json({
      success: true,
      message: 'Bid rejected',
      data: bid
    });
  } catch (error) {
    console.error('Reject bid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject bid',
      error: error.message
    });
  }
});

// Generate AI proposal
router.post('/generate-proposal', auth, async (req, res) => {
  try {
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({
        success: false,
        message: 'Only freelancers can generate proposals'
      });
    }

    const { jobTitle, jobDescription, userSkills, currentProposal } = req.body;

    if (!jobTitle || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Job title and description are required'
      });
    }

    const generatedProposal = await generateProposal({
      jobTitle,
      jobDescription,
      userSkills: userSkills || req.user.skills || [],
      currentProposal: currentProposal || '',
      freelancerName: req.user.name
    });

    res.json({
      success: true,
      data: {
        proposal: generatedProposal,
        originalProposal: currentProposal || ''
      }
    });
  } catch (error) {
    console.error('Generate proposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate proposal',
      error: error.message
    });
  }
});

// Withdraw a bid (freelancer only)
router.put('/:bidId/withdraw', auth, async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.bidId);

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    if (bid.freelancerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (bid.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Bid cannot be withdrawn'
      });
    }

    bid.status = 'withdrawn';
    await bid.save();

    res.json({
      success: true,
      message: 'Bid withdrawn successfully',
      data: bid
    });
  } catch (error) {
    console.error('Withdraw bid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to withdraw bid',
      error: error.message
    });
  }
});

module.exports = router;