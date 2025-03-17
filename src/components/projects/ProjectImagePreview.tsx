
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { preloadImages } from "@/components/LazyImage";

interface ProjectImagePreviewProps {
  projectId: string;
  children: React.ReactNode;
  className?: string;
}

export function ProjectImagePreview({ 
  projectId, 
  children, 
  className 
}: ProjectImagePreviewProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProjectImage = async () => {
      if (!projectId) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('images')
          .select('url, url_miniature')
          .eq('id_projet', projectId)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (error) {
          console.error("Erreur lors de la récupération de l'image:", error);
          return;
        }
        
        if (data && data.length > 0) {
          // Use thumbnail URL if available, otherwise fallback to full image URL
          const imageUrl = data[0].url_miniature || data[0].url;
          setPreviewImage(imageUrl);
        }
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectImage();
  }, [projectId]);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className={cn("cursor-pointer", className)}>
            {children}
          </div>
        </TooltipTrigger>
        {previewImage && (
          <TooltipContent side="right" className="p-0 overflow-hidden border-0 shadow-xl" sideOffset={10}>
            <div className="relative w-64 h-48 bg-background">
              <img 
                src={previewImage} 
                alt="Aperçu du projet" 
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
