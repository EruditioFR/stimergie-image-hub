import React, { ReactNode } from 'react';
interface ToolbarContainerProps {
  children: ReactNode;
}
export function ToolbarContainer({
  children
}: ToolbarContainerProps) {
  return <div className="sticky top-20 z-10 bg-background/80 backdrop-blur-sm p-4 mb-4 rounded-lg border shadow-sm items-center justify-between flex w-full">
      {children}
    </div>;
}