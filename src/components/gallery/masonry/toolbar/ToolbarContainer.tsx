import React, { ReactNode } from 'react';
interface ToolbarContainerProps {
  children: ReactNode;
}
export function ToolbarContainer({
  children
}: ToolbarContainerProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-background/95 backdrop-blur-md px-3 py-2 rounded-lg border shadow-lg items-center justify-between flex w-auto max-w-4xl gap-3 animate-slide-in-bottom">
      {children}
    </div>
  );
}