export interface RoleDisplay {
  label: string;
  color: string;
}

export function getRoleDisplay(role: string | null): RoleDisplay {
  switch(role) {
    case 'admin':
      return { 
        label: 'Administrateur', 
        color: 'bg-destructive/10 text-destructive border-destructive/20' 
      };
    case 'admin_client':
      return { 
        label: 'Admin Client', 
        color: 'bg-primary/10 text-primary border-primary/20' 
      };
    case 'user':
    default:
      return { 
        label: 'Utilisateur', 
        color: 'bg-muted text-muted-foreground border-border' 
      };
  }
}
