
import { Link } from 'react-router-dom';
import { Home, Image, FileText, Users, FolderOpen, Building, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UserProfile {
  firstName: string;
  lastName: string;
  role: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  userProfile: UserProfile | null;
  location: { pathname: string };
  user: any;
  canAccessClientsPage: boolean;
  canAccessImagesPage: boolean;
  onLogout: () => Promise<void>;
  onNavigate: (path: string) => void;
  formatRole: (role: string) => string;
}

export function MobileMenu({
  isOpen,
  userProfile,
  location,
  user,
  canAccessClientsPage,
  canAccessImagesPage,
  onLogout,
  onNavigate,
  formatRole
}: MobileMenuProps) {
  if (!isOpen) return null;

  console.log("MobileMenu rendered with isOpen:", isOpen);

  const navigationItems = [
    { name: 'Accueil', path: '/', icon: <Home className="h-5 w-5 mr-3" /> },
    { name: 'Banque d\'images', path: '/gallery', icon: <Image className="h-5 w-5 mr-3" /> },
    { name: 'Ressources', path: '/resources', icon: <FileText className="h-5 w-5 mr-3" /> },
    { name: 'Ensemble', path: '/ensemble', icon: <Users className="h-5 w-5 mr-3" /> },
    { name: 'Albums partagés', path: '/shared-albums', icon: <FolderOpen className="h-5 w-5 mr-3" /> },
    { name: 'Clients', path: '/clients', icon: <Users className="h-5 w-5 mr-3" />, access: canAccessClientsPage },
    { name: 'Agence', path: '/agency', icon: <Building className="h-5 w-5 mr-3" /> },
    { name: 'Administration', path: '/admin', icon: <Settings className="h-5 w-5 mr-3" />, access: canAccessImagesPage }
  ];

  const filteredNavItems = navigationItems.filter(item => 
    !item.hasOwnProperty('access') || item.access === true
  );

  return (
    <div className="md:hidden fixed top-[60px] left-0 right-0 bg-background/95 backdrop-blur-lg shadow-lg animate-in fade-in-0 slide-in-from-top-5 z-50">
      <nav className="flex flex-col p-6 space-y-4">
        {userProfile && (
          <div className="text-center mb-4 py-2 border-b border-gray-100">
            <div className="font-medium">{userProfile.firstName} {userProfile.lastName}</div>
            <div className="text-sm text-muted-foreground">{formatRole(userProfile.role)}</div>
          </div>
        )}
        
        {filteredNavItems.map((item) => (
          <Link 
            key={item.name}
            to={item.path} 
            className={cn(
              "flex items-center text-base font-medium py-2 transition-colors",
              location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                ? "text-primary"
                : "text-foreground hover:text-primary"
            )}
          >
            {item.icon}
            {item.name}
          </Link>
        ))}
        
        {user ? (
          <Button variant="destructive" onClick={onLogout} className="mt-4">
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        ) : (
          <Button variant="default" onClick={() => onNavigate('/auth')} className="mt-4">
            Connexion
          </Button>
        )}
      </nav>
    </div>
  );
}

export default MobileMenu;
