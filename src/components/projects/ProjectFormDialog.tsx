
import { ProjectForm } from "@/components/projects/ProjectForm";
import { Project } from "@/types/project";

interface ProjectFormDialogProps {
  show: boolean;
  initialData?: Project;
  onSubmit: (project: Project) => void;
  onCancel: () => void;
}

export function ProjectFormDialog({
  show,
  initialData,
  onSubmit,
  onCancel,
}: ProjectFormDialogProps) {
  if (!show) return null;
  
  return (
    <ProjectForm
      initialData={initialData}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
}
