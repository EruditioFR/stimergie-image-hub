
import { Client } from "@/pages/Clients";
import { UserRound, Building2, Phone, Mail, FileText, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ViewMode } from "@/components/ui/ViewToggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

interface ClientsListProps {
  clients: Client[];
  loading?: boolean;
  onEdit?: (client: Client) => void;
  onDelete?: (clientId: string) => void;
  viewMode?: ViewMode;
}

export function ClientsList({ 
  clients, 
  loading = false, 
  onEdit, 
  onDelete,
  viewMode = "card"
}: ClientsListProps) {
  if (loading) {
    return viewMode === "card" ? (
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
    ) : (
      <div className="w-full">
        <Skeleton className="h-12 w-full mb-4" />
        {[1, 2, 3, 4, 5].map((item) => (
          <Skeleton key={item} className="h-16 w-full mb-2" />
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

  // Card view
  if (viewMode === "card") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <Card 
            key={client.id} 
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserRound size={18} className="text-muted-foreground" />
                  {client.nom}
                </CardTitle>
                <div className="flex gap-2">
                  {onEdit && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onEdit(client)}
                      title="Modifier"
                    >
                      <Pencil size={16} />
                    </Button>
                  )}
                  {onDelete && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onDelete(client.id!)}
                      title="Supprimer"
                      className="text-destructive hover:text-destructive/90"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
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
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // List view
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Entreprise</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <UserRound size={16} className="text-muted-foreground" />
                  {client.nom}
                </div>
              </TableCell>
              <TableCell>{client.entreprise || "Non spécifié"}</TableCell>
              <TableCell>{client.email || "Non spécifié"}</TableCell>
              <TableCell>{client.telephone || "Non spécifié"}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {onEdit && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onEdit(client)}
                      title="Modifier"
                    >
                      <Pencil size={16} />
                    </Button>
                  )}
                  {onDelete && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onDelete(client.id!)}
                      title="Supprimer"
                      className="text-destructive hover:text-destructive/90"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
