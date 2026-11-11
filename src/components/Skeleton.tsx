import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-4 w-full', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`bg-arena-card/80 animate-pulse rounded ${className}`}
          aria-hidden="true"
        />
      ))}
    </>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 5,
}) => {
  return (
    <div className="w-full space-y-3 p-4" aria-label="Loading content" role="status">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} className="h-6 flex-1 bg-arena-card" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-2 border-b border-arena-border/30">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1 bg-arena-card/60" />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading content...</span>
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Loading cards" role="status">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-arena-surface border border-arena-border rounded-xl p-6 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-1/2 bg-arena-card" />
            <Skeleton className="h-5 w-16 bg-arena-card rounded-full" />
          </div>
          <Skeleton className="h-14 w-full bg-arena-card/60" />
          <div className="pt-2 flex justify-between items-center border-t border-arena-border/40">
            <Skeleton className="h-4 w-24 bg-arena-card/60" />
            <Skeleton className="h-4 w-20 bg-arena-card/60" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading cards...</span>
    </div>
  );
};
