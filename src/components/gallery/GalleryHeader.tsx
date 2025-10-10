
import { SearchBar } from '@/components/SearchBar';
import { useAuth } from '@/context/AuthContext';
import { ClientsFilter } from './ClientsFilter';
import { ProjectsFilter } from './ProjectsFilter';
import { OrientationFilter } from './OrientationFilter';
import { useSearchParams } from 'react-router-dom';

interface GalleryHeaderProps {
  title: string;
  activeTab: string;
  onTabChange: (value: string) => void;
  categories: string[];
  selectedClient: string | null;
  onClientChange: (clientId: string | null) => void;
  selectedProject: string | null;
  onProjectChange: (projectId: string | null) => void;
  selectedOrientation: string | null;
  onOrientationChange: (orientation: string | null) => void;
  userName?: string;
  userLastName?: string;
  userRole?: string;
  userClientId?: string | null;
}

export function GalleryHeader({ 
  title, 
  activeTab, 
  onTabChange, 
  categories,
  selectedClient,
  onClientChange,
  selectedProject,
  onProjectChange,
  selectedOrientation,
  onOrientationChange,
  userName = "",
  userLastName = "",
  userRole,
  userClientId
}: GalleryHeaderProps) {
  const { userRole: contextUserRole } = useAuth();
  const effectiveUserRole = userRole || contextUserRole;
  const isAdmin = ['admin', 'admin_client'].includes(effectiveUserRole);
  const canSeeProjectFilter = ['admin', 'admin_client', 'user'].includes(effectiveUserRole);
  const [searchParams] = useSearchParams();
  const tagFilter = searchParams.get('tag') || '';
  
  const handleTabChange = (value: string) => {
    // Convert category name to lowercase or 'all' for consistent filtering
    const normalizedValue = value.toLowerCase() === 'toutes' ? 'all' : value.toLowerCase();
    onTabChange(normalizedValue);
  };
  
  return (
    <div className="bg-[#dcd0bb] border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-6">{title}</h1>
          
          {tagFilter && (
            <p className="text-lg text-primary font-medium mb-4">
              Filtré sur le mot-clé : "{tagFilter}"
            </p>
          )}
          
          {title === "Banque d'images" && (
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Bonjour {userName} {userLastName},
              <br /><br />
              Cette galerie vous propose l'ensemble des photos créées par Imprononçable pour vos projets. 
              Vous pouvez les filtrer par catégorie, par type de droits, puis les prévisualiser et les télécharger.
            </p>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
          <SearchBar className="md:max-w-sm" variant="minimal" />
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:ml-auto">
            <OrientationFilter
              selectedOrientation={selectedOrientation}
              onOrientationChange={onOrientationChange}
              className="w-full sm:w-auto"
            />
            
            {isAdmin && (
              <ClientsFilter 
                selectedClient={selectedClient}
                onClientChange={onClientChange}
                className="w-full sm:w-auto"
                userRole={effectiveUserRole}
                userClientId={userClientId}
              />
            )}
            
            {canSeeProjectFilter && (
              <ProjectsFilter 
                selectedProject={selectedProject}
                onProjectChange={onProjectChange}
                className="w-full sm:w-auto"
                selectedClient={effectiveUserRole === 'user' ? userClientId : selectedClient}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
