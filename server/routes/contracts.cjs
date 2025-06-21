const express = require('express');
const Contract = require('../models/Contract.cjs');
const Conversation = require('../models/Conversation.cjs');
const Job = require('../models/Job.cjs');
const Bid = require('../models/Bid.cjs');
const Notification = require('../models/Notification.cjs');
const auth = require('../middleware/auth.cjs');
const { createPaymentIntent } = require('../utils/stripeHelper.cjs');

const router = express.Router();

// Get contract by job ID
router.get('/job/:jobId', auth, async (req, res) => {
  try {
    const contract = await Contract.findOne({ jobId: req.params.jobId })
      .populate('jobId')
      .populate('bidId')
      .populate('clientId', 'name email avatar rating')
      .populate('freelancerId', 'name email avatar rating')
      .populate('conversationId');

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    // Check if user is part of this contract
    const isAuthorized = contract.clientId._id.toString() === req.user._id.toString() ||
                        contract.freelancerId._id.toString() === req.user._id.toString();

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: contract
    });
  } catch (error) {
    console.error('Get contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contract',
      error: error.message
    });
  }
});

// Create contract (automatically called when bid is accepted)
router.post('/', auth, async (req, res) => {
  try {
    const { jobId, bidId } = req.body;

    const job = await Job.findById(jobId);
    const bid = await Bid.findById(bidId);

    if (!job || !bid) {
      return res.status(404).json({
        success: false,
        message: 'Job or bid not found'
      });
    }

    if (job.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if contract already exists
    const existingContract = await Contract.findOne({ jobId, bidId });
    if (existingContract) {
      return res.status(400).json({
        success: false,
        message: 'Contract already exists'
      });
    }

    // Create conversation for this contract
    const conversation = new Conversation({
      participants: [job.clientId, bid.freelancerId],
      jobId: job._id,
      bidId: bid._id
    });
    await conversation.save();

    // Create contract
    const contract = new Contract({
      jobId: job._id,
      bidId: bid._id,
      clientId: job.clientId,
      freelancerId: bid.freelancerId,
      amount: bid.amount,
      conversationId: conversation._id
    });

    await contract.save();

    // Update conversation with contract ID
    conversation.contractId = contract._id;
    await conversation.save();

    const populatedContract = await Contract.findById(contract._id)
      .populate('jobId')
      .populate('bidId')
      .populate('clientId', 'name email avatar')
      .populate('freelancerId', 'name email avatar')
      .populate('conversationId');

    res.status(201).json({
      success: true,
      message: 'Contract created successfully',
      data: populatedContract
    });
  } catch (error) {
    console.error('Create contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create contract',
      error: error.message
    });
  }
});

// Add task to contract
router.post('/:contractId/tasks', auth, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.contractId);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    // Check authorization
    const isAuthorized = contract.clientId.toString() === req.user._id.toString() ||
                        contract.freelancerId.toString() === req.user._id.toString();

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { title, description, dueDate, assignedTo } = req.body;

    const taskData = {
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assignedTo: assignedTo || contract.freelancerId
    };

    await contract.addTask(taskData);

    res.json({
      success: true,
      message: 'Task added successfully',
      data: contract
    });
  } catch (error) {
    console.error('Add task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add task',
      error: error.message
    });
  }
});

// Update task status
router.put('/:contractId/tasks/:taskId', auth, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.contractId);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    // Check authorization
    const isAuthorized = contract.clientId.toString() === req.user._id.toString() ||
                        contract.freelancerId.toString() === req.user._id.toString();

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { status } = req.body;

    await contract.updateTaskStatus(req.params.taskId, status);

    // Create notification for task update
    const otherUserId = contract.clientId.toString() === req.user._id.toString() 
      ? contract.freelancerId 
      : contract.clientId;

    const task = contract.tasks.id(req.params.taskId);
    const notification = new Notification({
      userId: otherUserId,
      type: 'task_update',
      title: 'Task Updated',
      message: `Task "${task.title}" status changed to ${status}`,
      data: {
        contractId: contract._id,
        taskId: req.params.taskId,
        status
      },
      actionUrl: `/contract/${contract.jobId}`
    });

    await notification.save();

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: contract
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: error.message
    });
  }
});

// Add milestone
router.post('/:contractId/milestones', auth, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.contractId);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    // Only client can add milestones
    if (contract.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only client can add milestones'
      });
    }

    const { title, description, amount, dueDate } = req.body;

    const milestoneData = {
      title,
      description,
      amount,
      dueDate: dueDate ? new Date(dueDate) : undefined
    };

    await contract.addMilestone(milestoneData);

    res.json({
      success: true,
      message: 'Milestone added successfully',
      data: contract
    });
  } catch (error) {
    console.error('Add milestone error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add milestone',
      error: error.message
    });
  }
});

// Approve milestone
router.put('/:contractId/milestones/:milestoneId/approve', auth, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.contractId);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    // Only client can approve milestones
    if (contract.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only client can approve milestones'
      });
    }

    await contract.approveMilestone(req.params.milestoneId);

    // Create notification for freelancer
    const milestone = contract.milestones.id(req.params.milestoneId);
    const notification = new Notification({
      userId: contract.freelancerId,
      type: 'milestone_approved',
      title: 'Milestone Approved',
      message: `Milestone "${milestone.title}" has been approved`,
      data: {
        contractId: contract._id,
        milestoneId: req.params.milestoneId
      },
      actionUrl: `/contract/${contract.jobId}`
    });

    await notification.save();

    res.json({
      success: true,
      message: 'Milestone approved successfully',
      data: contract
    });
  } catch (error) {
    console.error('Approve milestone error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve milestone',
      error: error.message
    });
  }
});

// Complete contract
router.put('/:contractId/complete', auth, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.contractId)
      .populate('jobId');

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    // Only client can complete contract
    if (contract.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only client can complete contract'
      });
    }

    // Update contract status
    contract.status = 'completed';
    contract.endDate = new Date();
    await contract.save();

    // Update job status
    contract.jobId.status = 'completed';
    await contract.jobId.save();

    // Create notification for freelancer
    const notification = new Notification({
      userId: contract.freelancerId,
      type: 'contract_completed',
      title: 'Contract Completed',
      message: `Contract for "${contract.jobId.title}" has been marked as completed`,
      data: {
        contractId: contract._id,
        jobId: contract.jobId._id
      },
      actionUrl: `/contract/${contract.jobId._id}`
    });

    await notification.save();

    res.json({
      success: true,
      message: 'Contract completed successfully',
      data: contract
    });
  } catch (error) {
    console.error('Complete contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete contract',
      error: error.message
    });
  }
});

// Create payment intent for contract
router.post('/:contractId/payment', auth, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.contractId)
      .populate('jobId')
      .populate('freelancerId', 'name email');

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    // Only client can initiate payment
    if (contract.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only client can initiate payment'
      });
    }

    if (contract.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Contract already paid'
      });
    }

    const paymentIntent = await createPaymentIntent({
      amount: contract.amount,
      currency: 'usd',
      description: `Payment for: ${contract.jobId.title}`,
      metadata: {
        contractId: contract._id.toString(),
        jobId: contract.jobId._id.toString(),
        freelancerId: contract.freelancerId._id.toString()
      }
    });

    // Update contract with payment intent
    contract.paymentIntentId = paymentIntent.id;
    await contract.save();

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
});

// Get user's contracts
router.get('/user', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = {
      $or: [
        { clientId: req.user._id },
        { freelancerId: req.user._id }
      ]
    };

    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const contracts = await Contract.find(filter)
      .populate('jobId', 'title budget deadline')
      .populate('clientId', 'name avatar rating')
      .populate('freelancerId', 'name avatar rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Contract.countDocuments(filter);

    res.json({
      success: true,
      data: {
        contracts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalContracts: total
        }
      }
    });
  } catch (error) {
    console.error('Get user contracts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contracts',
      error: error.message
    });
  }
});

module.exports = router;