import React, { ReactNode } from 'react';
interface ToolbarContainerProps {
  children: ReactNode;
}
export function ToolbarContainer({
  children
}: ToolbarContainerProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-background/95 backdrop-blur-md p-4 rounded-xl border-2 shadow-2xl items-center justify-between flex w-[95%] max-w-4xl animate-slide-in-bottom">
      {children}
    </div>
  );
}