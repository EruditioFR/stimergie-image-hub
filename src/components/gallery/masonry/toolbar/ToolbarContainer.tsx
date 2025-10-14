import React, { ReactNode } from 'react';
interface ToolbarContainerProps {
  children: ReactNode;
}
export function ToolbarContainer({
  children
}: ToolbarContainerProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-background/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg border shadow-lg flex flex-col items-center w-auto max-w-4xl gap-1.5 animate-slide-in-bottom">
      {children}
    </div>
  );
}