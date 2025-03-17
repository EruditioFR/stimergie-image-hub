
interface UsersEmptyStateProps {
  isEmpty: boolean;
}

export function UsersEmptyState({ isEmpty }: UsersEmptyStateProps) {
  return (
    <div className="text-center py-20">
      <h3 className="text-xl font-medium mb-2">Aucun utilisateur trouvé</h3>
      <p className="text-muted-foreground">
        {isEmpty ? "Aucun utilisateur n'est enregistré dans le système." : "Aucun utilisateur ne correspond au filtre sélectionné."}
      </p>
    </div>
  );
}
