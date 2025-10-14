
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface OrientationFilterProps {
  selectedOrientation: string | null;
  onOrientationChange: (orientation: string | null) => void;
  className?: string;
}

export function OrientationFilter({ 
  selectedOrientation, 
  onOrientationChange,
  className 
}: OrientationFilterProps) {
  
  const handleValueChange = (value: string) => {
    if (value === 'all') {
      onOrientationChange(null);
    } else {
      onOrientationChange(value);
    }
  };

  return (
    <div className={className}>
      <Select 
        value={selectedOrientation || 'all'}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Orientation" />
        </SelectTrigger>
        <SelectContent side="bottom" sideOffset={4} avoidCollisions={false} className="z-50 bg-background">
          <SelectItem value="all">
            Toutes les orientations
          </SelectItem>
          <SelectItem value="portrait">
            Portrait
          </SelectItem>
          <SelectItem value="landscape">
            Paysage
          </SelectItem>
          <SelectItem value="square">
            Carré
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
