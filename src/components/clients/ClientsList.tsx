
import { Client } from "@/pages/Clients";
import { UserRound, Building2, Phone, Mail, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientsListProps {
  clients: Client[];
  loading?: boolean;
}

export function ClientsList({ clients, loading = false }: ClientsListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="bg-white shadow-sm rounded-lg p-6 border border-border">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="text-xl font-medium mb-2">Aucun client pour le moment</h3>
        <p className="text-muted-foreground">
          Commencez par ajouter votre premier client en cliquant sur le bouton "Ajouter un client"
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clients.map((client) => (
        <div 
          key={client.id} 
          className="bg-white shadow-sm rounded-lg p-6 border border-border hover:shadow-md transition-shadow"
        >
          <h3 className="font-medium text-lg mb-4 flex items-center gap-2">
            <UserRound size={18} className="text-muted-foreground" />
            {client.nom}
          </h3>
          
          <div className="space-y-3 text-sm">
            {client.entreprise && (
              <p className="flex items-center gap-2">
                <Building2 size={16} className="text-muted-foreground" />
                {client.entreprise}
              </p>
            )}
            
            {client.email && (
              <p className="flex items-center gap-2">
                <Mail size={16} className="text-muted-foreground" />
                {client.email}
              </p>
            )}
            
            {client.telephone && (
              <p className="flex items-center gap-2">
                <Phone size={16} className="text-muted-foreground" />
                {client.telephone}
              </p>
            )}
            
            {client.notes && (
              <div className="pt-2 mt-2 border-t border-border">
                <p className="flex items-start gap-2">
                  <FileText size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                  <span className="line-clamp-3">{client.notes}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
