import React, { useEffect, useState } from 'react';
import { bidsApi } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FileText, DollarSign, Clock, Eye, CheckCircle, XCircle, Clock as ClockIcon } from 'lucide-react';
import { Bid } from '../types';

export function MyBids() {
  const { user } = useAuth();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchBids() {
      setLoading(true);
      try {
        const res = await bidsApi.getFreelancerBids();
        setBids(res.data?.bids || []);
        setError(null);
      } catch (e) {
        setBids([]);
        setError('Failed to load bids. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchBids();
  }, []);

  // Role check - only freelancers can view their bids
  if (user?.role !== 'freelancer') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-silver-100 mb-2">Access Denied</h2>
          <p className="text-silver-400">Only freelancers can view their submitted bids.</p>
        </Card>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'withdrawn':
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <ClockIcon className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'withdrawn':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-silver-100 mb-2">My Bids</h1>
        <p className="text-silver-400">Track your submitted proposals and their status</p>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm text-center" aria-live="polite">
          <div className="flex items-center justify-center gap-2">
            <XCircle className="w-4 h-4" />
            {error}
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-silver-400">Loading your bids...</span>
        </div>
      ) : bids.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-silver-100 mb-2">No Bids Submitted Yet</h2>
          <p className="text-silver-400 mb-6">Start bidding on jobs to see your proposals here.</p>
          <Button 
            onClick={() => navigate('/find-jobs')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Browse Available Jobs
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bids.map((bid: Bid) => (
            <Card
              key={bid._id}
              className="h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer"
              onClick={() => navigate(`/job/${bid.jobId}`)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-semibold text-silver-100 line-clamp-2 flex-1 mr-3">
                    {bid.job?.title || 'Job Title Unavailable'}
                  </h2>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(bid.status)}`}>
                    {bid.status}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold">${bid.amount?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-silver-400 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{bid.timeline} days timeline</span>
                  </div>
                  <div className="flex items-center gap-2 text-silver-400 text-sm">
                    {getStatusIcon(bid.status)}
                    <span>Submitted {new Date(bid.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
                  <p className="text-silver-300 text-sm leading-relaxed line-clamp-3">
                    {bid.proposal}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-silver-400 text-sm">
                    <Eye className="w-4 h-4" />
                    <span>View Job Details</span>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border-blue-500/30"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      navigate(`/job/${bid.jobId}`); 
                    }}
                  >
                    View Job
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 