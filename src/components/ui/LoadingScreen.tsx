
import { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';

interface LoadingScreenProps {
  duration?: number;
  onFinished?: () => void;
}

export function LoadingScreen({ duration = 3000, onFinished }: LoadingScreenProps) {
  const [opacity, setOpacity] = useState(1);
  
  useEffect(() => {
    // Start fading out after 80% of the duration has passed
    const fadeOutStart = setTimeout(() => {
      setOpacity(0);
    }, duration * 0.8);
    
    // Trigger the onFinished callback after the full duration
    const finishTimeout = setTimeout(() => {
      if (onFinished) onFinished();
    }, duration);
    
    return () => {
      clearTimeout(fadeOutStart);
      clearTimeout(finishTimeout);
    };
  }, [duration, onFinished]);
  
  return (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50"
      style={{ 
        opacity, 
        transition: 'opacity 0.5s ease-out'
      }}
    >
      <img 
        src="/lovable-uploads/9ce78881-8c65-4716-ab7f-128bb420c8e9.png" 
        alt="Stimergie Logo" 
        className="h-24 w-auto mb-8" 
      />
      <div className="animate-spin text-primary">
        <Loader size={36} />
      </div>
    </div>
  );
}
