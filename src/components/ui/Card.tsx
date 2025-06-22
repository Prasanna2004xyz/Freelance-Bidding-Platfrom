import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ 
  className, 
  children, 
  hover = false, 
  onClick,
  variant = 'default',
  padding = 'md'
}: CardProps) {
  const Component = onClick ? motion.button : motion.div;
  
  const variants = {
    default: 'glass-card',
    elevated: 'glass-card shadow-2xl',
    outlined: 'bg-transparent border-2 border-silver-200/20 backdrop-blur-sm',
  };
  
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  return (
    <Component
      className={cn(
        variants[variant],
        paddings[padding],
        'transition-all duration-300',
        hover && 'hover:bg-black/30 hover:scale-[1.02] hover:shadow-2xl cursor-pointer hover:-translate-y-1',
        onClick && 'w-full text-left',
        className
      )}
      whileHover={hover ? { y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
    >
      {children}
    </Component>
  );
}