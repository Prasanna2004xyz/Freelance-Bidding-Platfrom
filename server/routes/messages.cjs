const express = require('express');
const Message = require('../models/Message.cjs');
const Conversation = require('../models/Conversation.cjs');
const auth = require('../middleware/auth.cjs');

const router = express.Router();

// Get user's conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
      isActive: true
    })
    .populate('participants', 'name avatar isOnline lastSeen')
    .populate('lastMessage')
    .populate('jobId', 'title')
    .populate('contractId')
    .sort({ updatedAt: -1 });

    // Add unread count for current user
    const conversationsWithUnread = conversations.map(conv => {
      const unreadCount = conv.unreadCount.get(req.user._id.toString()) || 0;
      return {
        ...conv.toObject(),
        unreadCount
      };
    });

    res.json({
      success: true,
      data: conversationsWithUnread
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: error.message
    });
  }
});

// Get messages for a conversation
router.get('/conversations/:conversationId', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ 
      conversationId: req.params.conversationId,
      deletedAt: null
    })
    .populate('senderId', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
      { 
        conversationId: req.params.conversationId,
        senderId: { $ne: req.user._id },
        'readBy.userId': { $ne: req.user._id }
      },
      { 
        $push: { 
          readBy: { 
            userId: req.user._id, 
            readAt: new Date() 
          } 
        } 
      }
    );

    // Reset unread count for this user
    await conversation.resetUnreadCount(req.user._id);

    const total = await Message.countDocuments({ 
      conversationId: req.params.conversationId,
      deletedAt: null
    });

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalMessages: total
        }
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
});

// Send a message
router.post('/conversations/:conversationId', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { content, type = 'text' } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Create message
    const message = new Message({
      conversationId: req.params.conversationId,
      senderId: req.user._id,
      content: content.trim(),
      type
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    
    // Increment unread count for other participants
    for (const participantId of conversation.participants) {
      if (participantId.toString() !== req.user._id.toString()) {
        await conversation.incrementUnreadCount(participantId);
      }
    }

    await conversation.save();

    // Populate message for response
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name avatar');

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// Delete a message
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only sender can delete message
    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Soft delete
    message.deletedAt = new Date();
    message.content = 'This message was deleted';
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message
    });
  }
});

// Create conversation (for direct messaging)
router.post('/conversations', auth, async (req, res) => {
  try {
    const { participantId, jobId, bidId } = req.body;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: 'Participant ID is required'
      });
    }

    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      participants: { $all: [req.user._id, participantId] },
      jobId: jobId || null,
      bidId: bidId || null
    });

    if (existingConversation) {
      return res.json({
        success: true,
        data: existingConversation
      });
    }

    // Create new conversation
    const conversation = new Conversation({
      participants: [req.user._id, participantId],
      jobId: jobId || undefined,
      bidId: bidId || undefined
    });

    await conversation.save();

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'name avatar isOnline lastSeen')
      .populate('jobId', 'title')
      .populate('bidId');

    res.status(201).json({
      success: true,
      data: populatedConversation
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation',
      error: error.message
    });
  }
});

module.exports = router;