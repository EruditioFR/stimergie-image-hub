
import React from 'react';
import { Ellipsis } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: number;
}

export function LoadingSpinner({ className, size = 24 }: LoadingSpinnerProps) {
  return (
    <div className={cn("animate-pulse", className)}>
      <Ellipsis size={size} className="text-muted-foreground" />
    </div>
  );
}
