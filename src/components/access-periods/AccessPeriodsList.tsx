
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { AccessPeriod } from './ProjectAccessPeriods';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AccessPeriodsListProps {
  accessPeriods: AccessPeriod[];
  onEdit: (period: AccessPeriod) => void;
  onToggleActive: (periodId: string, isActive: boolean) => void;
  onDelete: (periodId: string) => void;
}

export function AccessPeriodsList({ 
  accessPeriods, 
  onEdit, 
  onToggleActive, 
  onDelete 
}: AccessPeriodsListProps) {
  const isCurrentlyActive = (period: AccessPeriod) => {
    if (!period.is_active) return false;
    const now = new Date();
    const start = new Date(period.access_start);
    const end = new Date(period.access_end);
    return now >= start && now <= end;
  };

  const getStatusBadge = (period: AccessPeriod) => {
    if (!period.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    const now = new Date();
    const start = new Date(period.access_start);
    const end = new Date(period.access_end);
    
    if (now < start) {
      return <Badge variant="outline">À venir</Badge>;
    } else if (now > end) {
      return <Badge variant="destructive">Expirée</Badge>;
    } else {
      return <Badge variant="default">Active</Badge>;
    }
  };

  if (accessPeriods.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground text-center">
            Aucune période d'accès configurée
          </p>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Créez une nouvelle période pour commencer
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {accessPeriods.map((period) => (
        <Card key={period.id}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <CardTitle className="text-lg">
                  {period.project_name || 'Projet sans nom'}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Client: {period.client_name || 'Client inconnu'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(period)}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(period)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onToggleActive(period.id, period.is_active)}
                    >
                      {period.is_active ? (
                        <>
                          <ToggleLeft className="mr-2 h-4 w-4" />
                          Désactiver
                        </>
                      ) : (
                        <>
                          <ToggleRight className="mr-2 h-4 w-4" />
                          Activer
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(period.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Période d'accès</p>
                <p>
                  Du {format(new Date(period.access_start), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </p>
                <p>
                  Au {format(new Date(period.access_end), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Informations</p>
                <p>
                  Créée {formatDistanceToNow(new Date(period.created_at), { 
                    addSuffix: true, 
                    locale: fr 
                  })}
                </p>
                {period.updated_at !== period.created_at && (
                  <p className="text-xs text-muted-foreground">
                    Modifiée {formatDistanceToNow(new Date(period.updated_at), { 
                      addSuffix: true, 
                      locale: fr 
                    })}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
