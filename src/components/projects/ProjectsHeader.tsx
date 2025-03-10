
import { Button } from "@/components/ui/button";
import { FolderPlus } from "lucide-react";

interface ProjectsHeaderProps {
  onAddClick: () => void;
}

export function ProjectsHeader({ onAddClick }: ProjectsHeaderProps) {
  return (
    <div className="bg-muted/40">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projets</h1>
            <p className="text-muted-foreground mt-1">
              Gérez tous vos projets et associez-les à vos clients
            </p>
          </div>
          <Button onClick={onAddClick} className="shrink-0">
            <FolderPlus className="mr-2 h-4 w-4" />
            Créer un projet
          </Button>
        </div>
      </div>
    </div>
  );
}
