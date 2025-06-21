import React from 'react';
import { motion } from 'framer-motion';
import { Clock, DollarSign, MapPin, Eye, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatRelativeTime } from '../../lib/utils';
import { Job } from '../../types';

interface JobCardProps {
  job: Job;
  showBidButton?: boolean;
}

export function JobCard({ job, showBidButton = true }: JobCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
    >
      <Card hover className="h-full">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <Link 
              to={`/job/${job._id}`}
              className="text-xl font-semibold text-silver-100 hover:text-blue-400 transition-colors line-clamp-2"
            >
              {job.title}
            </Link>
            <div className="flex items-center space-x-4 mt-2 text-sm text-silver-400">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{formatRelativeTime(job.createdAt)}</span>
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

        <p className="text-silver-300 mb-4 line-clamp-3">
          {job.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {job.skills.slice(0, 4).map((skill) => (
            <Badge key={skill} variant="default" size="sm">
              {skill}
            </Badge>
          ))}
          {job.skills.length > 4 && (
            <Badge variant="default" size="sm">
              +{job.skills.length - 4} more
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-green-400">
              <DollarSign className="w-4 h-4" />
              <span className="font-semibold">
                {job.budget.type === 'fixed' 
                  ? `${formatCurrency(job.budget.min)} - ${formatCurrency(job.budget.max)}`
                  : `${formatCurrency(job.budget.min)}/hr - ${formatCurrency(job.budget.max)}/hr`
                }
              </span>
            </div>
            {job.client?.location && (
              <div className="flex items-center space-x-1 text-silver-400">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{job.client.location}</span>
              </div>
            )}
          </div>

          {showBidButton && job.status === 'open' && (
            <Link 
              to={`/job/${job._id}/bid`}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-sm font-medium"
            >
              Submit Proposal
            </Link>
          )}
        </div>

        {job.client && (
          <div className="mt-4 pt-4 border-t border-silver-200/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {job.client.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-silver-200 text-sm font-medium">{job.client.name}</p>
                <div className="flex items-center space-x-2 text-xs text-silver-400">
                  <span>★ {job.client.rating || 0}</span>
                  <span>•</span>
                  <span>{job.client.completedProjects || 0} projects</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}