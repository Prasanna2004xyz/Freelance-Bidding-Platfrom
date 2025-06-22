import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { jobsApi, bidsApi } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { Job, Bid } from '../types';
import { FileText, DollarSign, Clock, Users, Eye, X, CheckCircle, User } from 'lucide-react';

export function MyJobs() {
  const { user } = useAuth();
  const location = useLocation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBidsModal, setShowBidsModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      try {
        const res = await jobsApi.getClientJobs(user?._id || '');
        let jobsList = res.data?.jobs || [];
        
        // Optimistic UI: if navigated from job posting, add the new job if not present
        if (location.state && location.state.newJob) {
          const exists = jobsList.some((j: Job) => j._id === location.state.newJob._id);
          if (!exists) {
            jobsList = [location.state.newJob, ...jobsList];
          }
          
          // Show success message if provided
          if (location.state.message) {
            toast.success(location.state.message);
          }
        }
        
        setJobs(jobsList);
      } catch {
        setJobs([]);
        toast.error('Failed to fetch jobs');
      } finally {
        setLoading(false);
      }
    }
    if (user?._id) fetchJobs();
  }, [user, location.state]);

  // Clear location state after processing to prevent showing message again on refresh
  useEffect(() => {
    if (location.state) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const openBidsModal = async (job: Job) => {
    setSelectedJob(job);
    setShowBidsModal(true);
    setBidsLoading(true);
    try {
      const res = await bidsApi.getJobBids(job._id);
      setBids(res.data || []);
    } catch {
      setBids([]);
      toast.error('Failed to fetch bids');
    } finally {
      setBidsLoading(false);
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    setAccepting(bidId);
    try {
      await bidsApi.acceptBid(bidId);
      toast.success('Bid accepted! Contract started.');
      setShowBidsModal(false);
      // Refresh jobs to update status
      const res = await jobsApi.getClientJobs(user?._id || '');
      setJobs(res.data?.jobs || []);
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || 'Failed to accept bid');
    } finally {
      setAccepting(null);
    }
  };

  // Focus trap and ESC key for modal
  useLayoutEffect(() => {
    if (!showBidsModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowBidsModal(false);
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    // Focus modal on open
    setTimeout(() => { modalRef.current?.focus(); }, 0);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showBidsModal]);

  // Role check - only clients can view their jobs
  if (user?.role !== 'client') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-silver-100 mb-2">Access Denied</h2>
          <p className="text-silver-400">Only clients can view their posted jobs.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-silver-100 mb-2">My Jobs</h1>
        <p className="text-silver-400">Manage your posted jobs and review bids from freelancers</p>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-silver-400">Loading your jobs...</span>
        </div>
      ) : jobs.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-silver-100 mb-2">No Jobs Posted Yet</h2>
          <p className="text-silver-400 mb-6">Start by posting your first job to find talented freelancers.</p>
          <Button 
            onClick={() => navigate('/post-job')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Post Your First Job
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job: Job) => (
            <Card key={job._id} className="h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10">
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-semibold text-silver-100 line-clamp-2 flex-1 mr-3">
                    {job.title}
                  </h2>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    job.status === 'open' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    job.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    job.status === 'completed' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                    'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}>
                    {job.status.replace('_', ' ')}
                  </span>
                </div>
                
                <p className="text-silver-400 mb-4 line-clamp-3 text-sm leading-relaxed">
                  {job.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {job.skills?.slice(0, 3).map((skill: string) => (
                    <span key={skill} className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded-full text-xs font-medium border border-blue-500/30">
                      {skill}
                    </span>
                  ))}
                  {job.skills && job.skills.length > 3 && (
                    <span className="bg-gray-600/20 text-gray-400 px-2 py-1 rounded-full text-xs">
                      +{job.skills.length - 3} more
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <DollarSign className="w-4 h-4" />
                    <span>${job.budget?.min?.toLocaleString()} - ${job.budget?.max?.toLocaleString()} ({job.budget?.type})</span>
                  </div>
                  <div className="flex items-center gap-2 text-silver-400 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-4 text-silver-400 text-sm">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{job.bids?.length || 0} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{job.bids?.length || 0} proposals</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => openBidsModal(job)}
                    className="flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    View Bids ({job.bids?.length || 0})
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/job/${job._id}`)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Bids Modal */}
      {showBidsModal && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div
            className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-700/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative outline-none shadow-2xl"
            ref={modalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={`Bids for ${selectedJob.title}`}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-gray-900 to-black rounded-t-2xl border-b border-gray-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white pr-8 line-clamp-2">Bids for {selectedJob.title}</h2>
                <Button
                  onClick={() => setShowBidsModal(false)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-gray-700/50"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-green-400">
                  <DollarSign className="w-4 h-4" />
                  <span>Budget: ${selectedJob.budget?.min?.toLocaleString()} - ${selectedJob.budget?.max?.toLocaleString()} ({selectedJob.budget?.type})</span>
                </div>
                <div className="flex items-center gap-2 text-silver-400">
                  <Users className="w-4 h-4" />
                  <span>{bids.length} bids received</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {bidsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-3 text-silver-400">Loading bids...</span>
                </div>
              ) : bids.length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-silver-100 mb-2">No Bids Yet</h3>
                  <p className="text-silver-400">Your job hasn't received any proposals yet. Check back later!</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {bids.map((bid: Bid) => (
                    <Card key={bid._id} className="p-4 border border-gray-700/50 hover:border-blue-500/30 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {bid.freelancer?.name?.charAt(0).toUpperCase() || 'F'}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-silver-100">{bid.freelancer?.name || 'Unknown Freelancer'}</h4>
                              <div className="flex items-center gap-4 text-xs text-silver-400">
                                <span>★ {bid.freelancer?.rating || 0}</span>
                                <span>•</span>
                                <span>{bid.freelancer?.completedProjects || 0} projects</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm mb-3">
                            <div className="flex items-center gap-1 text-green-400">
                              <DollarSign className="w-4 h-4" />
                              <span className="font-semibold">${bid.amount?.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1 text-silver-400">
                              <Clock className="w-4 h-4" />
                              <span>{bid.timeline} days</span>
                            </div>
                            {bid.status === 'pending' && (
                              <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded text-xs border border-blue-500/30">
                                New
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => handleAcceptBid(bid._id)}
                          loading={accepting === bid._id}
                          disabled={bid.status !== 'pending'}
                          className={`transition-all duration-200 ${
                            bid.status === 'pending' 
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                              : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {accepting === bid._id ? (
                            <div className="flex items-center gap-2">
                              <span className="animate-spin inline-block w-4 h-4 border-2 border-t-transparent border-white rounded-full"></span>
                              Accepting...
                            </div>
                          ) : bid.status === 'pending' ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Accept Bid
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}</span>
                            </div>
                          )}
                        </Button>
                      </div>
                      
                      <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
                        <p className="text-silver-300 text-sm leading-relaxed line-clamp-4">
                          {bid.proposal}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-silver-500 text-xs">
                          Status: <span className={`${
                            bid.status === 'pending' ? 'text-yellow-400' :
                            bid.status === 'accepted' ? 'text-green-400' :
                            bid.status === 'rejected' ? 'text-red-400' :
                            'text-gray-400'
                          }`}>{bid.status}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-400 hover:text-blue-300"
                          onClick={() => navigate(`/job/${selectedJob._id}`)}
                        >
                          View Job Details
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 