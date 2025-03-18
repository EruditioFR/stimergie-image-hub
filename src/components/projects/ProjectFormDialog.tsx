
import { ProjectForm } from "@/components/projects/ProjectForm";
import { Project } from "@/types/project";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Project;
  clients: { id: string; nom: string }[];
  onSubmit: (project: Project) => void;
  project?: Project;
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  initialData,
  clients,
  onSubmit,
  project
}: ProjectFormDialogProps) {
  // Use project prop as initialData if provided (for backward compatibility)
  const projectData = project || initialData;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{projectData ? "Modifier le projet" : "Ajouter un nouveau projet"}</DialogTitle>
        </DialogHeader>
        <ProjectForm
          initialData={projectData}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
