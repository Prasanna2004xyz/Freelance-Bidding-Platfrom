import React from 'react';

export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'client' | 'freelancer';
  avatar?: string;
  bio?: string;
  skills?: string[];
  hourlyRate?: number;
  location?: string;
  portfolio?: string;
  rating?: number;
  completedProjects?: number;
  isOnline?: boolean;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Job {
  _id: string;
  title: string;
  description: string;
  skills: string[];
  budget: {
    min: number;
    max: number;
    type: 'fixed' | 'hourly';
  };
  deadline: Date;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  clientId: string;
  client?: User;
  bids?: Bid[];
  selectedBid?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bid {
  _id: string;
  jobId: string;
  job?: Job;
  freelancerId: string;
  freelancer?: User;
  amount: number;
  proposal: string;
  timeline: number; // in days
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Contract {
  _id: string;
  jobId: string;
  job?: Job;
  bidId: string;
  bid?: Bid;
  clientId: string;
  client?: User;
  freelancerId: string;
  freelancer?: User;
  amount: number;
  status: 'active' | 'completed' | 'cancelled' | 'disputed';
  startDate: Date;
  endDate?: Date;
  tasks?: Task[];
  milestones?: Milestone[];
  payments?: Payment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed';
  assignedTo?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  _id: string;
  title: string;
  description?: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  _id: string;
  contractId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  stripePaymentId?: string;
  transactionId?: string;
  paymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  content: string;
  type: 'text' | 'file' | 'system';
  attachments?: string[];
  readBy?: { userId: string; readAt: Date }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  _id: string;
  participants: string[];
  participantDetails?: User[];
  jobId?: string;
  job?: Job;
  bidId?: string;
  bid?: Bid;
  contractId?: string;
  contract?: Contract;
  lastMessage?: Message;
  unreadCount?: { [userId: string]: number };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  _id: string;
  userId: string;
  type: 'bid_received' | 'bid_accepted' | 'bid_rejected' | 'message' | 'payment' | 'task_update' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  loading: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'client' | 'freelancer';
  bio?: string;
  skills?: string[];
  hourlyRate?: number;
  location?: string;
}

export interface SocketContextType {
  socket: any;
  isConnected: boolean;
  onlineUsers: string[];
  typing: { [conversationId: string]: string[] };
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (conversationId: string, content: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  markNotificationRead: (notificationId: string) => void;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface JobFilters {
  skills?: string[];
  budgetMin?: number;
  budgetMax?: number;
  budgetType?: 'fixed' | 'hourly';
  status?: string[];
  datePosted?: 'today' | 'week' | 'month';
  search?: string;
}

export interface DashboardStats {
  totalJobs?: number;
  totalBids?: number;
  totalContracts?: number;
  totalEarnings?: number;
  activeProjects?: number;
  completedProjects?: number;
  successRate?: number;
  averageRating?: number;
}