
interface ProjectsEmptyStateProps {
  isEmpty: boolean;
}

export function ProjectsEmptyState({ isEmpty }: ProjectsEmptyStateProps) {
  return (
    <div className="text-center py-20">
      <h3 className="text-xl font-medium mb-2">Aucun projet trouvé</h3>
      <p className="text-muted-foreground">
        {isEmpty ? "Aucun projet n'est enregistré dans le système." : "Aucun projet ne correspond au filtre sélectionné."}
      </p>
    </div>
  );
}
