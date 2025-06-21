const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'completed'],
    default: 'todo'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dueDate: Date,
  completedAt: Date
}, {
  timestamps: true
});

const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid'],
    default: 'pending'
  },
  dueDate: Date,
  approvedAt: Date,
  paidAt: Date
}, {
  timestamps: true
});

const contractSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  bidId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'disputed'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  tasks: [taskSchema],
  milestones: [milestoneSchema],
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
  },
  paymentIntentId: String,
  stripeSessionId: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes
contractSchema.index({ clientId: 1, status: 1 });
contractSchema.index({ freelancerId: 1, status: 1 });
contractSchema.index({ jobId: 1 });
contractSchema.index({ bidId: 1 });

// Methods
contractSchema.methods.addTask = function(taskData) {
  this.tasks.push(taskData);
  return this.save();
};

contractSchema.methods.updateTaskStatus = function(taskId, status) {
  const task = this.tasks.id(taskId);
  if (task) {
    task.status = status;
    if (status === 'completed') {
      task.completedAt = new Date();
    }
    return this.save();
  }
  throw new Error('Task not found');
};

contractSchema.methods.addMilestone = function(milestoneData) {
  this.milestones.push(milestoneData);
  return this.save();
};

contractSchema.methods.approveMilestone = function(milestoneId) {
  const milestone = this.milestones.id(milestoneId);
  if (milestone) {
    milestone.status = 'approved';
    milestone.approvedAt = new Date();
    return this.save();
  }
  throw new Error('Milestone not found');
};

module.exports = mongoose.model('Contract', contractSchema);