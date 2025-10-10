import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Infinity } from 'lucide-react';

interface GalleryScrollToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const GalleryScrollToggle = ({ enabled, onToggle }: GalleryScrollToggleProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="infinite-scroll"
        checked={enabled}
        onCheckedChange={onToggle}
      />
      <Label htmlFor="infinite-scroll" className="flex items-center gap-2 cursor-pointer">
        <Infinity className="h-4 w-4" />
        Défilement infini
      </Label>
    </div>
  );
};
