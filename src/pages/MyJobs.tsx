import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { jobsApi, bidsApi } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { Job, Bid } from '../types';

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
        const res = await jobsApi.getClientJobs(user._id);
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
      const res = await jobsApi.getClientJobs(user._id);
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-silver-100 mb-6">My Jobs</h1>
      {loading ? (
        <div className="text-silver-400">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="text-silver-400">No jobs posted yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job: Job) => (
            <Card key={job._id}>
              <h2 className="text-xl font-semibold text-silver-100 mb-2">{job.title}</h2>
              <p className="text-silver-400 mb-2">{job.description?.slice(0, 100)}...</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {job.skills?.map((skill: string) => (
                  <span key={skill} className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded text-xs">{skill}</span>
                ))}
              </div>
              <div className="text-silver-400 text-sm mb-2">Budget: ${job.budget?.min} - ${job.budget?.max} ({job.budget?.type})</div>
              <Button size="sm" className="mt-2" onClick={() => openBidsModal(job)}>View Bids</Button>
            </Card>
          ))}
        </div>
      )}

      {/* Bids Modal */}
      {showBidsModal && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div
            className="bg-black/90 rounded-xl p-8 max-w-lg w-full relative outline-none"
            ref={modalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={`Bids for ${selectedJob.title}`}
          >
            <button
              className="absolute top-4 right-4 text-silver-400 hover:text-silver-100 focus:ring-2 focus:ring-blue-500 rounded transition"
              onClick={() => setShowBidsModal(false)}
              aria-label="Close bids modal"
            >&times;</button>
            <h2 className="text-2xl font-bold text-silver-100 mb-4">Bids for {selectedJob.title}</h2>
            {bidsLoading ? (
              <div className="text-silver-400">Loading bids...</div>
            ) : bids.length === 0 ? (
              <div className="text-silver-400">No bids yet.</div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {bids.map((bid: Bid) => (
                  <Card key={bid._id} className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="font-semibold text-silver-100">{bid.freelancerId?.name}</span>
                        <span className="ml-2 text-silver-400 text-xs">Bid: ${bid.amount}</span>
                        <span className="ml-2 text-silver-400 text-xs">Timeline: {bid.timeline} days</span>
                        {bid.aiGenerated && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded text-xs align-middle">AI</span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAcceptBid(bid._id)}
                        loading={accepting === bid._id}
                        disabled={bid.status !== 'pending'}
                        className={`transition ${bid.status !== 'pending' ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'}`}
                        tabIndex={0}
                      >
                        {bid.status === 'pending' ? 'Accept Bid' : bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                      </Button>
                    </div>
                    <div className="text-silver-400 text-sm mb-1 line-clamp-4">{bid.proposal}</div>
                    <div className="flex items-center justify-between">
                      <div className="text-silver-500 text-xs">Status: {bid.status}</div>
                      <Button
                        size="xs"
                        variant="ghost"
                        className="ml-2 text-blue-400 hover:text-blue-300 focus:underline"
                        onClick={() => navigate(`/job/${selectedJob._id}`)}
                        tabIndex={0}
                      >
                        View Job
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 