const express = require('express');
const Job = require('../models/Job.cjs');
const User = require('../models/User.cjs');
const auth = require('../middleware/auth.cjs');

const router = express.Router();

// Get all jobs with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      skills,
      budgetMin,
      budgetMax,
      budgetType,
      status = 'open',
      search,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status };
    
    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      filter.skills = { $in: skillsArray };
    }

    if (budgetMin || budgetMax) {
      filter['budget.min'] = {};
      if (budgetMin) filter['budget.min'].$gte = parseInt(budgetMin);
      if (budgetMax) filter['budget.max'] = { $lte: parseInt(budgetMax) };
    }

    if (budgetType) {
      filter['budget.type'] = budgetType;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort object
    const sortObject = {};
    sortObject[sort] = order === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const jobs = await Job.find(filter)
      .populate('clientId', 'name rating completedProjects')
      .sort(sortObject)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(filter);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalJobs: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error.message
    });
  }
});

// Get single job by ID
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('clientId', 'name rating completedProjects location')
      .populate({
        path: 'selectedBid',
        populate: {
          path: 'freelancerId',
          select: 'name rating completedProjects'
        }
      });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Increment view count
    await job.incrementViews();

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job',
      error: error.message
    });
  }
});

// Create new job (clients only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Only clients can create jobs'
      });
    }

    const jobData = {
      ...req.body,
      clientId: req.user._id
    };

    const job = new Job(jobData);
    await job.save();

    const populatedJob = await Job.findById(job._id)
      .populate('clientId', 'name rating completedProjects');

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: populatedJob
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job',
      error: error.message
    });
  }
});

// Update job (job owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own jobs'
      });
    }

    // Don't allow updating if job has active bids
    if (job.status === 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update job that is in progress'
      });
    }

    const allowedUpdates = ['title', 'description', 'skills', 'budget', 'deadline', 'status'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('clientId', 'name rating completedProjects');

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: updatedJob
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job',
      error: error.message
    });
  }
});

// Delete job (job owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own jobs'
      });
    }

    if (job.status === 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete job that is in progress'
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job',
      error: error.message
    });
  }
});

// Get jobs by client
router.get('/client/:clientId', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { clientId: req.params.clientId };
    
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const jobs = await Job.find(filter)
      .populate('selectedBid')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(filter);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalJobs: total
        }
      }
    });
  } catch (error) {
    console.error('Get client jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client jobs',
      error: error.message
    });
  }
});

// Job Recommendations for freelancers
router.get('/recommendations', auth, async (req, res) => {
  try {
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({ success: false, message: 'Only freelancers get recommendations' });
    }
    const userSkills = req.user.skills || [];
    if (!userSkills.length) {
      return res.json({ success: true, data: [] });
    }
    // Find jobs that match at least one skill
    const jobs = await Job.find({
      status: 'open',
      skills: { $in: userSkills }
    })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ success: true, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch recommendations', error: error.message });
  }
});

// Trending Skills (from recent jobs)
router.get('/trending-skills', auth, async (req, res) => {
  try {
    // Get last 30 jobs
    const jobs = await Job.find({}).sort({ createdAt: -1 }).limit(30);
    const skillCounts = {};
    jobs.forEach(job => {
      (job.skills || []).forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });
    // Sort skills by frequency
    const trending = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill]) => skill);
    res.json({ success: true, data: trending });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch trending skills', error: error.message });
  }
});

module.exports = router;