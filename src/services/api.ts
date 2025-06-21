import axios from 'axios';
import { 
  Job, 
  Bid, 
  Contract, 
  Message, 
  Conversation, 
  Notification,
  JobFilters,
  PaginationParams,
  ApiResponse 
} from '../types';

const API_BASE_URL = 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add request interceptor to include token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Jobs API
export const jobsApi = {
  getJobs: (params?: PaginationParams & JobFilters): Promise<ApiResponse<{ jobs: Job[]; pagination: any }>> =>
    api.get('/jobs', { params }).then(res => res.data),
  
  getJob: (id: string): Promise<ApiResponse<Job>> =>
    api.get(`/jobs/${id}`).then(res => res.data),
  
  createJob: (jobData: Partial<Job>): Promise<ApiResponse<Job>> =>
    api.post('/jobs', jobData).then(res => res.data),
  
  updateJob: (id: string, jobData: Partial<Job>): Promise<ApiResponse<Job>> =>
    api.put(`/jobs/${id}`, jobData).then(res => res.data),
  
  deleteJob: (id: string): Promise<ApiResponse> =>
    api.delete(`/jobs/${id}`).then(res => res.data),
  
  getClientJobs: (clientId: string, params?: PaginationParams): Promise<ApiResponse<{ jobs: Job[]; pagination: any }>> =>
    api.get(`/jobs/client/${clientId}`, { params }).then(res => res.data),
};

// Bids API
export const bidsApi = {
  getJobBids: (jobId: string): Promise<ApiResponse<Bid[]>> =>
    api.get(`/bids/job/${jobId}`).then(res => res.data),
  
  getFreelancerBids: (params?: PaginationParams): Promise<ApiResponse<{ bids: Bid[]; pagination: any }>> =>
    api.get('/bids/freelancer', { params }).then(res => res.data),
  
  submitBid: (bidData: Partial<Bid>): Promise<ApiResponse<Bid>> =>
    api.post('/bids', bidData).then(res => res.data),
  
  acceptBid: (bidId: string): Promise<ApiResponse<Bid>> =>
    api.put(`/bids/${bidId}/accept`).then(res => res.data),
  
  rejectBid: (bidId: string): Promise<ApiResponse<Bid>> =>
    api.put(`/bids/${bidId}/reject`).then(res => res.data),
  
  withdrawBid: (bidId: string): Promise<ApiResponse<Bid>> =>
    api.put(`/bids/${bidId}/withdraw`).then(res => res.data),
  
  generateProposal: (data: {
    jobTitle: string;
    jobDescription: string;
    userSkills?: string[];
    currentProposal?: string;
  }): Promise<ApiResponse<{ proposal: string; originalProposal: string }>> =>
    api.post('/bids/generate-proposal', data).then(res => res.data),
};

// Contracts API
export const contractsApi = {
  getContractByJob: (jobId: string): Promise<ApiResponse<Contract>> =>
    api.get(`/contracts/job/${jobId}`).then(res => res.data),
  
  getUserContracts: (params?: PaginationParams): Promise<ApiResponse<{ contracts: Contract[]; pagination: any }>> =>
    api.get('/contracts/user', { params }).then(res => res.data),
  
  createContract: (contractData: { jobId: string; bidId: string }): Promise<ApiResponse<Contract>> =>
    api.post('/contracts', contractData).then(res => res.data),
  
  addTask: (contractId: string, taskData: any): Promise<ApiResponse<Contract>> =>
    api.post(`/contracts/${contractId}/tasks`, taskData).then(res => res.data),
  
  updateTaskStatus: (contractId: string, taskId: string, status: string): Promise<ApiResponse<Contract>> =>
    api.put(`/contracts/${contractId}/tasks/${taskId}`, { status }).then(res => res.data),
  
  addMilestone: (contractId: string, milestoneData: any): Promise<ApiResponse<Contract>> =>
    api.post(`/contracts/${contractId}/milestones`, milestoneData).then(res => res.data),
  
  approveMilestone: (contractId: string, milestoneId: string): Promise<ApiResponse<Contract>> =>
    api.put(`/contracts/${contractId}/milestones/${milestoneId}/approve`).then(res => res.data),
  
  completeContract: (contractId: string): Promise<ApiResponse<Contract>> =>
    api.put(`/contracts/${contractId}/complete`).then(res => res.data),
  
  createPaymentIntent: (contractId: string): Promise<ApiResponse<{ clientSecret: string; paymentIntentId: string }>> =>
    api.post(`/contracts/${contractId}/payment`).then(res => res.data),
};

// Messages API
export const messagesApi = {
  getConversations: (): Promise<ApiResponse<Conversation[]>> =>
    api.get('/messages/conversations').then(res => res.data),
  
  getMessages: (conversationId: string, params?: PaginationParams): Promise<ApiResponse<{ messages: Message[]; pagination: any }>> =>
    api.get(`/messages/conversations/${conversationId}`, { params }).then(res => res.data),
  
  sendMessage: (conversationId: string, content: string): Promise<ApiResponse<Message>> =>
    api.post(`/messages/conversations/${conversationId}`, { content }).then(res => res.data),
  
  deleteMessage: (messageId: string): Promise<ApiResponse> =>
    api.delete(`/messages/${messageId}`).then(res => res.data),
  
  createConversation: (data: { participantId: string; jobId?: string; bidId?: string }): Promise<ApiResponse<Conversation>> =>
    api.post('/messages/conversations', data).then(res => res.data),
};

// Notifications API
export const notificationsApi = {
  getNotifications: (params?: PaginationParams & { unreadOnly?: boolean }): Promise<ApiResponse<{ notifications: Notification[]; pagination: any; unreadCount: number }>> =>
    api.get('/notifications', { params }).then(res => res.data),
  
  markAsRead: (notificationId: string): Promise<ApiResponse<Notification>> =>
    api.put(`/notifications/${notificationId}/read`).then(res => res.data),
  
  markAllAsRead: (): Promise<ApiResponse> =>
    api.put('/notifications/read-all').then(res => res.data),
  
  deleteNotification: (notificationId: string): Promise<ApiResponse> =>
    api.delete(`/notifications/${notificationId}`).then(res => res.data),
};

// Payments API
export const paymentsApi = {
  getPaymentHistory: (params?: PaginationParams): Promise<ApiResponse<{ payments: any[]; pagination: any }>> =>
    api.get('/payments/history', { params }).then(res => res.data),
  
  getPaymentStats: (): Promise<ApiResponse<any>> =>
    api.get('/payments/stats').then(res => res.data),
};

export const getAnalytics = (): Promise<ApiResponse<any>> =>
  api.get('/auth/analytics').then(res => res.data);

export default api;