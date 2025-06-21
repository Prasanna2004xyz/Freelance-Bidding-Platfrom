const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  freelancerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  proposal: {
    type: String,
    required: true,
    maxlength: 2000
  },
  timeline: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  }],
  aiGenerated: {
    type: Boolean,
    default: false
  },
  originalProposal: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better performance
bidSchema.index({ jobId: 1, status: 1 });
bidSchema.index({ freelancerId: 1, status: 1 });
bidSchema.index({ createdAt: -1 });

// Prevent duplicate bids from same freelancer on same job
bidSchema.index({ jobId: 1, freelancerId: 1 }, { unique: true });

module.exports = mongoose.model('Bid', bidSchema);