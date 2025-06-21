import React from 'react';
import { motion } from 'framer-motion';
import { Clock, DollarSign, Star, MessageCircle, Check, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { formatCurrency, formatRelativeTime } from '../../lib/utils';
import { Bid } from '../../types';

interface BidCardProps {
  bid: Bid;
  onAccept?: (bidId: string) => void;
  onReject?: (bidId: string) => void;
  onMessage?: (freelancerId: string) => void;
  showActions?: boolean;
  isClient?: boolean;
}

export function BidCard({ 
  bid, 
  onAccept, 
  onReject, 
  onMessage, 
  showActions = false,
  isClient = false 
}: BidCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'withdrawn':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-4">
            {isClient && bid.freelancer && (
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {bid.freelancer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-silver-100">{bid.freelancer.name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-silver-400">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span>{bid.freelancer.rating || 0}</span>
                    </div>
                    <span>•</span>
                    <span>{bid.freelancer.completedProjects || 0} projects</span>
                  </div>
                </div>
              </div>
            )}
            
            {!isClient && bid.job && (
              <div>
                <h3 className="font-semibold text-silver-100 line-clamp-1">
                  {bid.job.title}
                </h3>
                <p className="text-sm text-silver-400">
                  Posted {formatRelativeTime(bid.job.createdAt)}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <Badge variant={getStatusColor(bid.status)}>
              {bid.status.replace('_', ' ')}
            </Badge>
            <div className="text-right">
              <div className="flex items-center space-x-1 text-green-400 font-semibold">
                <DollarSign className="w-4 h-4" />
                <span>{formatCurrency(bid.amount)}</span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-silver-400">
                <Clock className="w-3 h-3" />
                <span>{bid.timeline} days</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-silver-300 whitespace-pre-wrap">{bid.proposal}</p>
          {bid.aiGenerated && (
            <Badge variant="info" size="sm" className="mt-2">
              AI Enhanced
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-silver-400">
            Submitted {formatRelativeTime(bid.createdAt)}
          </div>

          {showActions && bid.status === 'pending' && (
            <div className="flex items-center space-x-2">
              {onMessage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMessage(bid.freelancerId)}
                  className="flex items-center space-x-1"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Message</span>
                </Button>
              )}
              
              {onReject && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onReject(bid._id)}
                  className="flex items-center space-x-1"
                >
                  <X className="w-4 h-4" />
                  <span>Decline</span>
                </Button>
              )}
              
              {onAccept && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onAccept(bid._id)}
                  className="flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Accept</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}