const jwt = require('jsonwebtoken');
const User = require('../models/User.cjs');

const connectedUsers = new Map();

module.exports = (io) => {
  // Authentication middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const userId = socket.handshake.auth.userId;
      
      if (userId) {
        const user = await User.findById(userId);
        if (user) {
          socket.userId = userId;
          socket.user = user;
          return next();
        }
      }
      
      return next(new Error('Authentication error'));
    } catch (error) {
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User ${socket.userId} connected`);
    
    // Add user to connected users
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user
    });

    // Update user online status
    await User.findByIdAndUpdate(socket.userId, { 
      isOnline: true,
      lastSeen: new Date()
    });

    // Broadcast user online status
    socket.broadcast.emit('user_connected', socket.userId);
    
    // Send list of online users to the connected user
    const onlineUsers = Array.from(connectedUsers.keys());
    socket.emit('users_online', onlineUsers);

    // Join user to their personal room for notifications
    socket.join(`user:${socket.userId}`);

    // Handle joining conversation rooms
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.userId} joined room: ${roomId}`);
    });

    // Handle leaving conversation rooms
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      console.log(`User ${socket.userId} left room: ${roomId}`);
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content } = data;
        
        // Create message in database (this would be handled by the message route)
        // For now, just broadcast the message
        const messageData = {
          conversationId,
          senderId: socket.userId,
          sender: socket.user,
          content,
          createdAt: new Date()
        };

        // Broadcast message to all users in the conversation
        io.to(conversationId).emit('new_message', messageData);
        
        console.log(`Message sent in conversation ${conversationId} by user ${socket.userId}`);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('message_error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (conversationId) => {
      socket.to(conversationId).emit('typing_start', {
        conversationId,
        userId: socket.userId
      });
    });

    socket.on('typing_stop', (conversationId) => {
      socket.to(conversationId).emit('typing_stop', {
        conversationId,
        userId: socket.userId
      });
    });

    // Handle notifications
    socket.on('mark_notification_read', async (notificationId) => {
      try {
        // Update notification in database
        // For now, just broadcast the update
        socket.emit('notification_read', notificationId);
      } catch (error) {
        console.error('Mark notification read error:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User ${socket.userId} disconnected`);
      
      // Remove user from connected users
      connectedUsers.delete(socket.userId);
      
      // Update user offline status
      await User.findByIdAndUpdate(socket.userId, { 
        isOnline: false,
        lastSeen: new Date()
      });

      // Broadcast user offline status
      socket.broadcast.emit('user_disconnected', socket.userId);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Helper function to send notification to a specific user
  const sendNotificationToUser = (userId, notification) => {
    io.to(`user:${userId}`).emit('new_notification', notification);
  };

  // Helper function to send message to a conversation
  const sendMessageToConversation = (conversationId, message) => {
    io.to(conversationId).emit('new_message', message);
  };

  // Export helper functions for use in other parts of the application
  io.sendNotificationToUser = sendNotificationToUser;
  io.sendMessageToConversation = sendMessageToConversation;
};