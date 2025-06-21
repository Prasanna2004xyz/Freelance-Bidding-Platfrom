import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, DollarSign, MapPin, Eye, Users, ArrowLeft, Calendar, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { jobsApi, bidsApi } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Job, Bid } from '../types';
import toast from 'react-hot-toast';

export function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [bids, setBids] = useState<Bid[]>([]);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showBidsModal, setShowBidsModal] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [proposal, setProposal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const bidAmountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchJob() {
      if (!id) return;
      setLoading(true);
      try {
        const res = await jobsApi.getJob(id);
        setJob(res.data);
        
        // If user is the job owner, fetch bids
        if (user?.role === 'client' && res.data.clientId === user._id) {
          const bidsRes = await bidsApi.getJobBids(id);
          setBids(bidsRes.data || []);
        }
      } catch (e: any) {
        toast.error(e?.response?.data?.message || 'Failed to fetch job');
        navigate('/jobs');
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [id, user]);

  const handleBidSubmit = async () => {
    if (!job) return;
    if (!bidAmount || !proposal) {
      setFormError('Please enter bid amount and proposal.');
      return;
    }
    setSubmitting(true);
    try {
      await bidsApi.submitBid({
        jobId: job._id,
        amount: Number(bidAmount),
        proposal,
        timeline: 7, // default 7 days
      });
      toast.success('Bid submitted!');
      setShowBidModal(false);
      setFormError(null);
      navigate('/my-bids');
    } catch (e: any) {
      setFormError(e?.response?.data?.message || 'Failed to submit bid');
      toast.error(e?.response?.data?.message || 'Failed to submit bid');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!job?.title || !job?.description) {
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
        jobTitle: job.title,
        jobDescription: job.description,
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

  const handleAcceptBid = async (bidId: string) => {
    setAccepting(bidId);
    try {
      await bidsApi.acceptBid(bidId);
      toast.success('Bid accepted! Contract started.');
      setShowBidsModal(false);
      // Refresh job and bids
      const jobRes = await jobsApi.getJob(id!);
      setJob(jobRes.data);
      const bidsRes = await bidsApi.getJobBids(id!);
      setBids(bidsRes.data || []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to accept bid');
    } finally {
      setAccepting(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-silver-400">Loading job...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-silver-100 mb-2">Job Not Found</h2>
          <p className="text-silver-400">The job you're looking for doesn't exist.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-silver-100">{job.title}</h1>
            <div className="flex items-center space-x-4 mt-2 text-sm text-silver-400">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{job.views || 0} views</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{job.proposals || 0} proposals</span>
              </div>
            </div>
          </div>
          <Badge 
            variant={job.status === 'open' ? 'success' : 'default'}
            className="ml-4"
          >
            {job.status.replace('_', ' ')}
          </Badge>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Description */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-silver-100 mb-4">Job Description</h2>
            <p className="text-silver-300 whitespace-pre-wrap">{job.description}</p>
          </Card>

          {/* Skills Required */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-silver-100 mb-4">Skills Required</h2>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <Badge key={skill} variant="default">
                  {skill}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Action Buttons */}
          {user?.role === 'freelancer' && job.status === 'open' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-silver-100 mb-4">Submit Your Proposal</h2>
              <Button
                onClick={() => setShowBidModal(true)}
                className="w-full"
                size="lg"
              >
                Submit Proposal
              </Button>
            </Card>
          )}

          {user?.role === 'client' && job.clientId === user._id && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-silver-100 mb-4">Manage Job</h2>
              <div className="flex space-x-4">
                <Button
                  onClick={() => setShowBidsModal(true)}
                  className="flex-1"
                >
                  View Bids ({bids.length})
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/job/${job._id}/edit`)}
                >
                  Edit Job
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Budget & Timeline */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-silver-100 mb-4">Budget & Timeline</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-silver-400">Budget:</span>
                <div className="text-right">
                  <div className="text-green-400 font-semibold">
                    ${job.budget.min} - ${job.budget.max}
                  </div>
                  <div className="text-silver-400 text-sm">{job.budget.type}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-silver-400">Deadline:</span>
                <span className="text-silver-100">
                  {new Date(job.deadline).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-silver-400">Project Length:</span>
                <span className="text-silver-100">
                  {job.projectLength?.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-silver-400">Experience Level:</span>
                <span className="text-silver-100 capitalize">
                  {job.experienceLevel}
                </span>
              </div>
            </div>
          </Card>

          {/* Client Info */}
          {job.client && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-silver-100 mb-4">Client</h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {job.client.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-silver-200 font-medium">{job.client.name}</p>
                  <div className="flex items-center space-x-2 text-sm text-silver-400">
                    <span>★ {job.client.rating || 0}</span>
                    <span>•</span>
                    <span>{job.client.completedProjects || 0} projects</span>
                  </div>
                  {job.client.location && (
                    <div className="flex items-center space-x-1 text-sm text-silver-400 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>{job.client.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Bid Modal */}
      {showBidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div
            className="bg-black/90 rounded-xl p-8 max-w-lg w-full relative outline-none"
            ref={modalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={`Bid for ${job.title}`}
          >
            <button
              className="absolute top-4 right-4 text-silver-400 hover:text-silver-100 focus:ring-2 focus:ring-blue-500 rounded transition"
              onClick={() => setShowBidModal(false)}
              aria-label="Close bid modal"
            >&times;</button>
            <h2 className="text-2xl font-bold text-silver-100 mb-4">Submit Proposal</h2>
            {formError && (
              <div className="mb-4 text-red-400 text-sm text-center" aria-live="polite">{formError}</div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-silver-200 mb-1">Your Bid Amount ($)</label>
                <input
                  ref={bidAmountRef}
                  type="number"
                  className="w-full p-2 rounded bg-black/30 border border-silver-200/20 text-silver-100 focus:ring-2 focus:ring-blue-500"
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                  min={1}
                  aria-label="Bid amount"
                />
              </div>
              <div>
                <label className="block text-silver-200 mb-1">Proposal</label>
                <textarea
                  className="w-full p-2 rounded bg-black/30 border border-silver-200/20 text-silver-100 focus:ring-2 focus:ring-blue-500"
                  value={proposal}
                  onChange={e => setProposal(e.target.value)}
                  rows={4}
                  aria-label="Proposal"
                />
                <Button
                  onClick={handleAIGenerate}
                  loading={generatingAI}
                  variant="secondary"
                  className="mt-2 flex items-center gap-2"
                  disabled={generatingAI || !job?.title || !job?.description}
                >
                  {generatingAI && (
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-t-transparent border-white rounded-full"></span>
                  )}
                  Write Proposal with AI
                </Button>
              </div>
              <Button
                onClick={handleBidSubmit}
                loading={submitting}
                className="w-full"
                disabled={!bidAmount || !proposal || submitting}
              >
                Submit Proposal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bids Modal */}
      {showBidsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div
            className="bg-black/90 rounded-xl p-8 max-w-lg w-full relative outline-none"
            ref={modalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={`Bids for ${job.title}`}
          >
            <button
              className="absolute top-4 right-4 text-silver-400 hover:text-silver-100 focus:ring-2 focus:ring-blue-500 rounded transition"
              onClick={() => setShowBidsModal(false)}
              aria-label="Close bids modal"
            >&times;</button>
            <h2 className="text-2xl font-bold text-silver-100 mb-4">Bids for {job.title}</h2>
            {bidsLoading ? (
              <div className="text-silver-400">Loading bids...</div>
            ) : bids.length === 0 ? (
              <div className="text-silver-400">No bids yet.</div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {bids.map((bid) => (
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
                      >
                        {bid.status === 'pending' ? 'Accept Bid' : bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                      </Button>
                    </div>
                    <div className="text-silver-400 text-sm mb-1 line-clamp-4">{bid.proposal}</div>
                    <div className="text-silver-500 text-xs">Status: {bid.status}</div>
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