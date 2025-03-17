
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ReactNode } from "react";

interface ProjectsHeaderProps {
  onAddClick: () => void;
  viewToggle: ReactNode;
}

export function ProjectsHeader({ onAddClick, viewToggle }: ProjectsHeaderProps) {
  return (
    <div className="bg-muted/30 border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Projets</h1>
          
          <div className="flex items-center gap-4">
            {viewToggle}
            
            <Button onClick={onAddClick}>
              <Plus size={16} className="mr-2" />
              Ajouter un projet
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
