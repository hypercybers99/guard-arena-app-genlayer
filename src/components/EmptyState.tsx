import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-arena-surface/60 border border-arena-border/80 rounded-xl space-y-4 max-w-lg mx-auto ${className}`}
      role="region"
      aria-label={title}
    >
      <div className="p-3.5 rounded-full bg-arena-card border border-arena-border text-arena-muted">
        <Icon className="w-8 h-8" />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
        <p className="text-xs text-arena-muted leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
