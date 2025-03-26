
import React from 'react';

interface MasonryLoadingProps {
  columnCount: number;
}

export function MasonryLoading({ columnCount }: MasonryLoadingProps) {
  return (
    <div className={`grid grid-cols-${Math.min(columnCount, 5)} gap-0.5 animate-pulse px-0.5`}>
      {Array.from({ length: columnCount * 2 }).map((_, index) => (
        <div key={index} className="h-64 rounded-md bg-muted"></div>
      ))}
    </div>
  );
}
