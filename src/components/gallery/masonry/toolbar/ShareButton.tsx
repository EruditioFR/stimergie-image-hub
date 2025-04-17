
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareButtonProps {
  onClick: () => void;
  shareKey?: string;
}

export function ShareButton({ onClick, shareKey }: ShareButtonProps) {
  const { toast } = useToast();
  const [shareUrl, setShareUrl] = useState<string>('');
  
  useEffect(() => {
    if (shareKey) {
      setShareUrl(`https://www.stimergie.fr/shared-album/${shareKey}`);
    }
  }, [shareKey]);

  const handleShareClick = () => {
    if (shareKey) {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Lien copié",
        description: "Le lien de partage a été copié dans le presse-papier."
      });
    } else {
      onClick();
    }
  };
  
  return (
    <Button 
      variant="default" 
      size="sm" 
      onClick={handleShareClick}
      className="flex items-center gap-2 py-4"
    >
      <Share className="h-4 w-4" /> Partager
    </Button>
  );
}
