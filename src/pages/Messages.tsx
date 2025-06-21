import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { messagesApi } from '../services/api';
import { ChatWindow } from '../components/chat/ChatWindow';
import { Conversation, Message } from '../types';
import { formatRelativeTime } from '../lib/utils';
import { Search, MessageCircle, Users, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export function Messages() {
  const { user } = useAuth();
  const { socket, joinRoom, leaveRoom } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);

  // Fetch conversations from API
  useEffect(() => {
    async function fetchConvs() {
      setLoadingConvs(true);
      try {
        const res = await messagesApi.getConversations();
        setConversations(res.data || []);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        toast.error('Failed to load conversations');
        setConversations([]);
      } finally {
        setLoadingConvs(false);
      }
    }
    fetchConvs();
  }, []);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConv) return;
    
    async function fetchMsgs() {
      setLoadingMsgs(true);
      try {
        const res = await messagesApi.getMessages(selectedConv._id);
        setMessages(res.data.messages || []);
        setSendError(null);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        toast.error('Failed to load messages');
        setMessages([]);
        setSendError('Failed to load messages.');
      } finally {
        setLoadingMsgs(false);
      }
    }
    
    fetchMsgs();
    
    // Join socket room for real-time updates
    joinRoom(selectedConv._id);
    
    return () => {
      leaveRoom(selectedConv._id);
    };
  }, [selectedConv, joinRoom, leaveRoom]);

  // Socket.IO: Listen for new messages
  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (msg: Message) => {
      // Update messages if it's for the current conversation
      if (msg.conversationId === selectedConv?._id) {
        setMessages(prev => [...prev, msg]);
      }
      
      // Update conversation list with new last message
      setConversations(prev => 
        prev.map(conv => 
          conv._id === msg.conversationId 
            ? { ...conv, lastMessage: msg }
            : conv
        )
      );
    };

    const handleConversationUpdate = (updatedConv: Conversation) => {
      setConversations(prev => 
        prev.map(conv => 
          conv._id === updatedConv._id ? updatedConv : conv
        )
      );
    };

    socket.on('new_message', handleNewMessage);
    socket.on('conversation_updated', handleConversationUpdate);
    
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('conversation_updated', handleConversationUpdate);
    };
  }, [socket, selectedConv]);

  const handleSendMessage = async (content: string) => {
    if (!selectedConv) return;
    
    try {
      const res = await messagesApi.sendMessage(selectedConv._id, content);
      setMessages(prev => [...prev, res.data]);
      setSendError(null);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      setSendError('Failed to send message.');
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    
    const otherParticipants = conv.participantDetails?.filter(p => p._id !== user?._id) || [];
    const participantNames = otherParticipants.map(p => p.name).join(' ');
    const lastMessageContent = conv.lastMessage?.content || '';
    
    return participantNames.toLowerCase().includes(searchQuery.toLowerCase()) ||
           lastMessageContent.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participantDetails?.find(p => p._id !== user?._id);
  };

  const getUnreadCount = (conversation: Conversation) => {
    return conversation.unreadCount?.[user?._id || ''] || 0;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-silver-100 mb-2 flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-blue-400" />
          Messages
        </h1>
        <p className="text-silver-400">Connect with clients and freelancers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-silver-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loadingConvs ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-silver-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{searchQuery ? 'No conversations found' : 'No conversations yet'}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                <AnimatePresence>
                  {filteredConversations.map(conv => {
                    const otherParticipant = getOtherParticipant(conv);
                    const unreadCount = getUnreadCount(conv);
                    const isSelected = selectedConv?._id === conv._id;
                    
                    return (
                      <motion.div
                        key={conv._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <div
                          className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-800/50 ${
                            isSelected ? 'bg-blue-600/20 border border-blue-500/30' : 'hover:border-gray-600/30 border border-transparent'
                          }`}
                          onClick={() => setSelectedConv(conv)}
                        >
                          <div className="flex items-center gap-3">
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
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-silver-100 truncate">
                                  {otherParticipant?.name || 'Unknown User'}
                                </h3>
                                {conv.lastMessage && (
                                  <span className="text-xs text-silver-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatRelativeTime(conv.lastMessage.createdAt)}
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-sm text-silver-400 truncate">
                                {conv.lastMessage?.content || 'No messages yet'}
                              </p>
                            </div>
                            
                            {unreadCount > 0 && (
                              <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                                {unreadCount > 99 ? '99+' : unreadCount}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </Card>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-3">
          {selectedConv ? (
            <Card className="h-[600px] overflow-hidden">
              <ChatWindow
                conversation={selectedConv}
                messages={messages}
                onSendMessage={handleSendMessage}
                loading={loadingMsgs}
              />
            </Card>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center text-silver-400">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                <p>Choose a conversation from the list to start messaging</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 