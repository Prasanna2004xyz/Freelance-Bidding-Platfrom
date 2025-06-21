import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ className, children, hover = false, onClick }: CardProps) {
  const Component = onClick ? motion.button : motion.div;
  
  return (
    <Component
      className={cn(
        'glass-card p-6 transition-all duration-300',
        hover && 'hover:bg-black/30 hover:scale-[1.02] hover:shadow-2xl cursor-pointer',
        onClick && 'w-full text-left',
        className
      )}
      whileHover={hover ? { y: -2 } : undefined}
      onClick={onClick}
    >
      {children}
    </Component>
  );
}