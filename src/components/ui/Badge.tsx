import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  icon?: React.ReactNode;
  removable?: boolean;
  onRemove?: () => void;
}

export function Badge({ 
  children, 
  variant = 'default', 
  size = 'md', 
  className,
  icon,
  removable = false,
  onRemove
}: BadgeProps) {
  const variants = {
    default: 'bg-silver-700/30 text-silver-200 border border-silver-600/30',
    primary: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    secondary: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
    outline: 'bg-transparent text-silver-300 border border-silver-600/50',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-200',
        variants[variant],
        sizes[size],
        removable && 'pr-1',
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
      {removable && (
        <button
          onClick={onRemove}
          className="ml-1 p-0.5 hover:bg-black/20 rounded-full transition-colors"
          aria-label="Remove badge"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </motion.span>
  );
}

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' | 'draft';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = {
    active: { variant: 'success' as const, text: 'Active' },
    inactive: { variant: 'danger' as const, text: 'Inactive' },
    pending: { variant: 'warning' as const, text: 'Pending' },
    completed: { variant: 'success' as const, text: 'Completed' },
    cancelled: { variant: 'danger' as const, text: 'Cancelled' },
    draft: { variant: 'outline' as const, text: 'Draft' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {config.text}
    </Badge>
  );
}

interface SkillBadgeProps {
  skill: string;
  level?: 'beginner' | 'intermediate' | 'expert';
  className?: string;
  onRemove?: () => void;
}

export function SkillBadge({ skill, level, className, onRemove }: SkillBadgeProps) {
  const levelColors = {
    beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
    intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    expert: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(level && levelColors[level], className)}
      removable={!!onRemove}
      onRemove={onRemove}
    >
      {skill}
      {level && (
        <span className="text-xs opacity-75 ml-1">
          ({level})
        </span>
      )}
    </Badge>
  );
}