import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, User, Briefcase, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { messagesApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface StartConversationProps {
  participantId: string;
  participantName: string;
  jobId?: string;
  jobTitle?: string;
  bidId?: string;
  onClose?: () => void;
  className?: string;
}

export function StartConversation({ 
  participantId, 
  participantName, 
  jobId, 
  jobTitle, 
  bidId, 
  onClose,
  className = ''
}: StartConversationProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStartConversation = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setLoading(true);
    try {
      // Create conversation
      const convRes = await messagesApi.createConversation({
        participantId,
        jobId,
        bidId
      });

      if (convRes.success && convRes.data) {
        // Send initial message
        await messagesApi.sendMessage(convRes.data._id, message);
        
        toast.success('Conversation started!');
        
        // Navigate to messages page
        navigate('/messages');
        
        // Close modal if provided
        onClose?.();
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast.error('Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  const getInitialMessage = () => {
    if (jobTitle) {
      return `Hi! I'm interested in your job "${jobTitle}". Can we discuss the details?`;
    }
    return `Hi ${participantName}! I'd like to discuss a potential collaboration.`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`${className}`}
    >
      <Card className="p-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-silver-100 mb-2">Start a Conversation</h3>
          <p className="text-silver-400">
            Send a message to <span className="text-blue-400 font-medium">{participantName}</span>
          </p>
        </div>

        {jobTitle && (
          <div className="mb-4 p-3 bg-blue-600/10 border border-blue-600/20 rounded-lg">
            <div className="flex items-center gap-2 text-blue-400">
              <Briefcase className="w-4 h-4" />
              <span className="text-sm font-medium">Job: {jobTitle}</span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-silver-200 mb-2">
              Your Message
            </label>
            <textarea
              className="w-full p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 text-silver-100 placeholder-silver-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              rows={4}
              placeholder={getInitialMessage()}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault();
                  handleStartConversation();
                }
              }}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartConversation}
              loading={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={!message.trim() || loading}
            >
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </div>
        </div>

        <div className="mt-4 text-xs text-silver-400 text-center">
          Press Ctrl+Enter to send quickly
        </div>
      </Card>
    </motion.div>
  );
} 