import React from 'react';
import { cn } from '../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
}

export function Skeleton({ className, variant = 'rect' }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-shimmer bg-white/5",
        variant === 'circle' ? "rounded-full" : "rounded-2xl",
        variant === 'text' ? "h-4 w-full" : "",
        className
      )}
    />
  );
}

// Pre-defined patterns for quick use
export function PageSkeleton() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-pulse">
      <div className="flex items-center gap-4">
        <Skeleton variant="circle" className="w-16 h-16" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/4 opacity-50" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}
