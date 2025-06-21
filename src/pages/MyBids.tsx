import React, { useEffect, useState } from 'react';
import { bidsApi } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function MyBids() {
  const { user } = useAuth();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchBids() {
      setLoading(true);
      try {
        const res = await bidsApi.getFreelancerBids();
        setBids(res.data.bids || []);
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-silver-100 mb-6">My Bids</h1>
      {error && <div className="mb-4 text-red-400 text-sm text-center" aria-live="polite">{error}</div>}
      {loading ? (
        <div className="text-silver-400">Loading bids...</div>
      ) : bids.length === 0 ? (
        <div className="text-silver-400">No bids submitted yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bids.map((bid: any) => (
            <Card
              key={bid._id}
              hover
              tabIndex={0}
              aria-label={`View details for bid on ${bid.jobId?.title}`}
              className="focus:ring-2 focus:ring-blue-500 transition outline-none"
              onClick={() => navigate(`/job/${bid.jobId?._id}`)}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && navigate(`/job/${bid.jobId?._id}`)}
            >
              <h2 className="text-xl font-semibold text-silver-100 mb-2">{bid.jobId?.title}</h2>
              <div className="text-silver-400 text-sm mb-2">Amount: ${bid.amount} &bull; Timeline: {bid.timeline} days</div>
              <p className="text-silver-400 mb-2 line-clamp-2">Proposal: {bid.proposal?.slice(0, 100)}...</p>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-silver-400 text-sm">Status: {bid.status}</span>
                {bid.aiGenerated && (
                  <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded text-xs align-middle ml-2">AI</span>
                )}
              </div>
              <Button
                size="sm"
                className="mt-2 focus:ring-2 focus:ring-blue-500"
                onClick={e => { e.stopPropagation(); navigate(`/job/${bid.jobId?._id}`); }}
                aria-label={`View job ${bid.jobId?.title}`}
              >
                View Job
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 