import React, { useEffect, useState, useRef } from 'react';
import { jobsApi, bidsApi } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FileText, MessageCircle } from 'lucide-react';
import { Job } from '../types';
import { StartConversation } from '../components/chat/StartConversation';

export function FindJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [proposal, setProposal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const bidAmountRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      try {
        const res = await jobsApi.getJobs();
        setJobs(res.data?.jobs || []);
      } catch {
        setJobs([]);
        toast.error('Failed to fetch jobs');
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  useEffect(() => {
    if (!showModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
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
    setTimeout(() => { bidAmountRef.current?.focus(); }, 0);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  const openJobModal = (job: Job) => {
    setSelectedJob(job);
    setShowModal(true);
    setBidAmount('');
    setProposal('');
    setFormError(null);
  };

  const handleBidSubmit = async () => {
    if (!selectedJob) {
      setFormError('No job selected.');
      return;
    }
    if (!bidAmount || !proposal) {
      setFormError('Please enter bid amount and proposal.');
      return;
    }
    setSubmitting(true);
    try {
      await bidsApi.submitBid({
        jobId: selectedJob._id,
        amount: Number(bidAmount),
        proposal,
        timeline: 7, // default 7 days
      });
      toast.success('Bid submitted!');
      setShowModal(false);
      setFormError(null);
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } } };
      setFormError(e?.response?.data?.message || 'Failed to submit bid');
      toast.error(e?.response?.data?.message || 'Failed to submit bid');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!selectedJob?.title || !selectedJob?.description) {
      toast.error('Job title and description are required for AI proposal.');
      return;
    }
    
    if (!user?.skills || user.skills.length === 0) {
      toast.error('Please add skills to your profile for better AI proposals.');
      return;
    }
    
    setGeneratingAI(true);
    try {
      const res = await bidsApi.generateProposal({
        jobTitle: selectedJob.title,
        jobDescription: selectedJob.description,
        userSkills: user?.skills || [],
        currentProposal: proposal,
      });
      
      if (res.data?.proposal && !res.data.proposal.startsWith("Couldn't connect to AI")) {
        setProposal(res.data.proposal);
        toast.success('AI proposal generated! You can edit it further.');
      } else {
        setProposal('');
        toast.error("Couldn't connect to AI service. Please try again later or write your proposal manually.");
      }
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } } };
      console.error('AI proposal generation error:', error);
      setProposal('');
      toast.error(e?.response?.data?.message || "Couldn't connect to AI service. Please try again later.");
    } finally {
      setGeneratingAI(false);
    }
  };

  // Role check - only freelancers can find and bid on jobs
  if (user?.role !== 'freelancer') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-silver-100 mb-2">Access Denied</h2>
          <p className="text-silver-400">Only freelancers can browse and bid on jobs.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-silver-100 mb-6">Find Jobs</h1>
      {loading ? (
        <div className="text-silver-400">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="text-silver-400">No jobs found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job: Job) => (
            <Card key={job._id} hover onClick={() => openJobModal(job)}>
              <h2 className="text-xl font-semibold text-silver-100 mb-2">{job.title}</h2>
              <p className="text-silver-400 mb-2">{job.description?.slice(0, 100)}...</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {job.skills?.map((skill: string) => (
                  <span key={skill} className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded text-xs">{skill}</span>
                ))}
              </div>
              <div className="text-silver-400 text-sm mb-2">Budget: ${job.budget?.min} - ${job.budget?.max} ({job.budget?.type})</div>
              <Button size="sm" className="mt-2">View Details</Button>
            </Card>
          ))}
        </div>
      )}

      {/* Job Details Modal */}
      {showModal && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div
            className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-700/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative outline-none shadow-2xl"
            ref={modalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={`Bid for ${selectedJob.title}`}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-gray-900 to-black rounded-t-2xl border-b border-gray-700/50 p-6">
              <button
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                onClick={() => setShowModal(false)}
                aria-label="Close bid modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white pr-8">{selectedJob.title}</h2>
                <Button
                  onClick={() => setShowMessageModal(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  size="sm"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message Client
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedJob.skills?.map((skill: string) => (
                  <span key={skill} className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium border border-blue-500/30">
                    {skill}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-green-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span>Budget: ${selectedJob.budget?.min} - ${selectedJob.budget?.max} ({selectedJob.budget?.type})</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Job Description */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Job Description
                </h3>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedJob.description}</p>
                </div>
              </div>

              {/* Error Message */}
              {formError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm" aria-live="polite">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formError}
                  </div>
                </div>
              )}

              {/* Bid Form */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Submit Your Bid
                </h3>

                {/* Bid Amount */}
                <div>
                  <label className="block text-gray-200 font-medium mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Your Bid Amount ($)
                  </label>
                  <input
                    ref={bidAmountRef}
                    type="number"
                    className="w-full p-3 rounded-lg bg-gray-800/50 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                    value={bidAmount}
                    onChange={e => setBidAmount(e.target.value)}
                    min={1}
                    placeholder="Enter your bid amount"
                    aria-label="Bid amount"
                    aria-invalid={!bidAmount}
                    aria-describedby={!bidAmount ? 'bid-amount-error' : undefined}
                  />
                  {!bidAmount && (
                    <div id="bid-amount-error" className="text-red-400 text-xs mt-1 flex items-center gap-1" aria-live="polite">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Bid amount is required.
                    </div>
                  )}
                </div>

                {/* Proposal */}
                <div>
                  <label className="block text-gray-200 font-medium mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Your Proposal
                  </label>
                  <textarea
                    className="w-full p-3 rounded-lg bg-gray-800/50 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 resize-vertical"
                    value={proposal}
                    onChange={e => setProposal(e.target.value)}
                    rows={6}
                    placeholder="Describe why you're the best fit for this job..."
                    aria-label="Proposal"
                    aria-invalid={!proposal}
                    aria-describedby={!proposal ? 'proposal-error' : undefined}
                    aria-live="polite"
                  />
                  {!proposal && (
                    <div id="proposal-error" className="text-red-400 text-xs mt-1 flex items-center gap-1" aria-live="polite">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Proposal is required.
                    </div>
                  )}
                  
                  {/* AI Generate Button */}
                  <Button
                    onClick={handleAIGenerate}
                    loading={generatingAI}
                    variant="secondary"
                    className="mt-3 flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
                    disabled={generatingAI || !selectedJob?.title || !selectedJob?.description}
                    aria-busy={generatingAI}
                    aria-label="Write Proposal with AI"
                    type="button"
                  >
                    {generatingAI ? (
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-t-transparent border-white rounded-full"></span>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                    {generatingAI ? 'Generating...' : 'Write Proposal with AI'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gradient-to-t from-gray-900 to-black rounded-b-2xl border-t border-gray-700/50 p-6">
              <Button
                onClick={handleBidSubmit}
                loading={submitting}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200"
                disabled={!bidAmount || !proposal || submitting}
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-t-transparent border-white rounded-full"></span>
                    Submitting Bid...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Submit Bid
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Start Conversation Modal */}
      {showMessageModal && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <StartConversation
            participantId={selectedJob.clientId || ''}
            participantName="Job Client"
            jobId={selectedJob._id}
            jobTitle={selectedJob.title}
            onClose={() => setShowMessageModal(false)}
          />
        </div>
      )}
    </div>
  );
}