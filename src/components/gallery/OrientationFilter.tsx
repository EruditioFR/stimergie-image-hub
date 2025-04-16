
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { AlignStartVertical, AlignStartHorizontal, Square } from 'lucide-react';

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
        <SelectContent>
          <SelectItem value="all" className="flex items-center gap-2">
            Toutes les orientations
          </SelectItem>
          <SelectItem value="portrait" className="flex items-center gap-2">
            <AlignStartVertical className="h-4 w-4" /> Portrait
          </SelectItem>
          <SelectItem value="paysage" className="flex items-center gap-2">
            <AlignStartHorizontal className="h-4 w-4" /> Paysage
          </SelectItem>
          <SelectItem value="carré" className="flex items-center gap-2">
            <Square className="h-4 w-4" /> Carré
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
