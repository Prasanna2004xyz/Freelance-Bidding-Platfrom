import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { SocketContextType, Notification } from '../types';

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL = 'http://localhost:5001';

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typing, setTyping] = useState<{ [conversationId: string]: string[] }>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user) {
      const newSocket = io(SOCKET_URL, {
        auth: {
          userId: user._id,
        },
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('users_online', (users: string[]) => {
        setOnlineUsers(users);
      });

      newSocket.on('user_connected', (userId: string) => {
        setOnlineUsers(prev => [...prev.filter(id => id !== userId), userId]);
      });

      newSocket.on('user_disconnected', (userId: string) => {
        setOnlineUsers(prev => prev.filter(id => id !== userId));
      });

      newSocket.on('typing_start', ({ conversationId, userId }: { conversationId: string; userId: string }) => {
        setTyping(prev => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] || []).filter(id => id !== userId), userId]
        }));
      });

      newSocket.on('typing_stop', ({ conversationId, userId }: { conversationId: string; userId: string }) => {
        setTyping(prev => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).filter(id => id !== userId)
        }));
      });

      newSocket.on('new_message', (message: any) => {
        // Handle new message (this will be used by message components)
        console.log('New message received:', message);
      });

      newSocket.on('new_notification', (notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
        // Play sound if enabled
        if (!notification.read && localStorage.getItem('notificationSound') !== 'off') {
          const audio = new Audio('/notification.mp3');
          audio.play();
        }
        // Show toast notification
        if (!notification.read) {
          toast.success(notification.title, {
            duration: 4000,
          });
        }
      });

      newSocket.on('notification_read', (notificationId: string) => {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [user]);

  const joinRoom = (roomId: string) => {
    if (socket) {
      socket.emit('join_room', roomId);
    }
  };

  const leaveRoom = (roomId: string) => {
    if (socket) {
      socket.emit('leave_room', roomId);
    }
  };

  const sendMessage = (conversationId: string, content: string) => {
    if (socket) {
      socket.emit('send_message', { conversationId, content });
    }
  };

  const startTyping = (conversationId: string) => {
    if (socket) {
      socket.emit('typing_start', conversationId);
    }
  };

  const stopTyping = (conversationId: string) => {
    if (socket) {
      socket.emit('typing_stop', conversationId);
    }
  };

  const markNotificationRead = (notificationId: string) => {
    if (socket) {
      socket.emit('mark_notification_read', notificationId);
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    onlineUsers,
    typing,
    notifications,
    setNotifications,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    markNotificationRead,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}