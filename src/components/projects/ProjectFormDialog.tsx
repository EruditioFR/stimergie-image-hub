
import { ProjectForm } from "@/components/projects/ProjectForm";
import { Project } from "@/types/project";
import { Client } from "@/pages/Clients";

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
  if (!open) return null;
  
  // Use project prop as initialData if provided (for backward compatibility)
  const projectData = project || initialData;
  
  return (
    <ProjectForm
      initialData={projectData}
      onSubmit={onSubmit}
      onCancel={() => onOpenChange(false)}
    />
  );
}
