import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Smile, MoreVertical, Image, File } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { Message, Conversation } from '../../types';
import { formatRelativeTime } from '../../lib/utils';

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  onSendMessage: (content: string) => void;
  loading?: boolean;
}

export function ChatWindow({ conversation, messages, onSendMessage, loading }: ChatWindowProps) {
  const { user } = useAuth();
  const { typing, startTyping, stopTyping } = useSocket();
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const otherParticipant = conversation.participantDetails?.find(
    p => p._id !== user?._id
  );

  const conversationTyping = typing[conversation._id] || [];
  const otherUserTyping = conversationTyping.filter(userId => userId !== user?._id);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (value: string) => {
    setMessageInput(value);

    if (value.trim() && !isTyping) {
      setIsTyping(true);
      startTyping(conversation._id);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        stopTyping(conversation._id);
      }
    }, 1000);
  };

  const handleSendMessage = () => {
    const content = messageInput.trim();
    if (!content) return;

    onSendMessage(content);
    setMessageInput('');
    
    if (isTyping) {
      setIsTyping(false);
      stopTyping(conversation._id);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // For now, just show a placeholder message
    // In a real implementation, you would upload the file to a server
    const file = files[0];
    onSendMessage(`📎 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getMessageStatus = (message: Message) => {
    if (message.senderId === user?._id) {
      const readBy = message.readBy || [];
      const otherParticipantId = otherParticipant?._id;
      const isRead = readBy.some(read => read.userId === otherParticipantId);
      
      return isRead ? '✓✓' : '✓';
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-silver-200/10 bg-gradient-to-r from-gray-900 to-black">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {otherParticipant?.name?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            {otherParticipant?.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-silver-100">{otherParticipant?.name || 'Unknown User'}</h3>
            <p className="text-sm text-silver-400">
              {otherParticipant?.isOnline ? '🟢 Online' : `Last seen ${formatRelativeTime(otherParticipant?.lastSeen || new Date())}`}
            </p>
          </div>
        </div>

        <Button variant="ghost" size="sm" className="text-silver-400 hover:text-silver-100">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-900 to-black">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.senderId === user?._id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md ${message.senderId === user?._id ? 'order-2' : 'order-1'}`}>
                <div
                  className={`px-4 py-2 rounded-lg shadow-lg ${
                    message.senderId === user?._id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-gray-800/50 text-silver-200 border border-gray-700/50'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                </div>
                <div className={`flex items-center gap-2 mt-1 ${message.senderId === user?._id ? 'justify-end' : 'justify-start'}`}>
                  <p className="text-xs text-silver-400">
                    {formatRelativeTime(message.createdAt)}
                  </p>
                  {getMessageStatus(message) && (
                    <span className="text-xs text-blue-400">
                      {getMessageStatus(message)}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {otherUserTyping.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex justify-start"
          >
            <div className="bg-gray-800/50 border border-gray-700/50 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-1">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-silver-200/10 bg-gradient-to-r from-gray-900 to-black">
        <div className="flex items-end space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-2 text-silver-400 hover:text-silver-100"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          
          <div className="flex-1">
            <Input
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className="resize-none bg-gray-800/50 border-gray-700/50 text-silver-100 placeholder-silver-400"
              disabled={loading}
            />
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-2 text-silver-400 hover:text-silver-100"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile className="w-4 h-4" />
          </Button>

          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || loading}
            className="mb-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <style jsx>{`
        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #9ca3af;
          animation: typing 1.4s infinite ease-in-out;
        }
        
        .typing-dot:nth-child(1) {
          animation-delay: -0.32s;
        }
        
        .typing-dot:nth-child(2) {
          animation-delay: -0.16s;
        }
        
        @keyframes typing {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}