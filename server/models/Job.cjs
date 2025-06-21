const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  skills: [{
    type: String,
    required: true,
    trim: true
  }],
  budget: {
    min: {
      type: Number,
      required: true,
      min: 0
    },
    max: {
      type: Number,
      required: true,
      min: 0
    },
    type: {
      type: String,
      enum: ['fixed', 'hourly'],
      required: true
    }
  },
  deadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'completed', 'cancelled'],
    default: 'open'
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  selectedBid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid',
    default: null
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  }],
  category: {
    type: String,
    trim: true
  },
  experienceLevel: {
    type: String,
    enum: ['entry', 'intermediate', 'expert'],
    default: 'intermediate'
  },
  projectLength: {
    type: String,
    enum: ['less_than_1_month', '1_to_3_months', '3_to_6_months', 'more_than_6_months'],
    default: '1_to_3_months'
  },
  proposals: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better performance
jobSchema.index({ clientId: 1, status: 1 });
jobSchema.index({ skills: 1, status: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ title: 'text', description: 'text', skills: 'text' });

// Virtual for bids
jobSchema.virtual('bids', {
  ref: 'Bid',
  localField: '_id',
  foreignField: 'jobId'
});

// Increment proposal count when a bid is created
jobSchema.methods.incrementProposals = function() {
  this.proposals += 1;
  return this.save();
};

// Increment view count
jobSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

module.exports = mongoose.model('Job', jobSchema);