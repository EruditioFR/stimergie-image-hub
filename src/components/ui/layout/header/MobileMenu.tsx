
import { Link } from 'react-router-dom';
import { Search, Users, LogIn, LogOut, FolderOpen, Image } from 'lucide-react';
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

  return (
    <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-lg shadow-lg animate-fade-in z-50">
      <nav className="flex flex-col p-6 space-y-4">
        <div className="flex justify-center mb-4">
          <img src="/lovable-uploads/9ce78881-8c65-4716-ab7f-128bb420c8e9.png" alt="Stimergie Logo" className="h-8 w-auto" />
        </div>
        
        {userProfile && (
          <div className="text-center mb-4 py-2 border-b border-gray-100">
            <div className="font-medium">{userProfile.firstName} {userProfile.lastName}</div>
            <div className="text-sm text-muted-foreground">{formatRole(userProfile.role)}</div>
          </div>
        )}
        
        <Link to="/" className={cn("text-base font-medium py-2 transition-colors text-black", location.pathname === "/" ? "text-primary" : "")}>
          Accueil
        </Link>
        {user && (
          <Link to="/gallery" className="text-base font-medium py-2 transition-colors text-black">
            Banque d'images
          </Link>
        )}
        {user && (
          <>
            {canAccessClientsPage && (
              <Link to="/clients" className="text-base font-medium py-2 transition-colors text-black">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Clients
                </span>
              </Link>
            )}
            <Link to="/projects" className="text-base font-medium py-2 transition-colors text-black">
              <span className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Projets
              </span>
            </Link>
            <Link to="/users" className="text-base font-medium py-2 transition-colors text-black">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Utilisateurs
              </span>
            </Link>
            {canAccessImagesPage && (
              <Link to="/images" className="text-base font-medium py-2 transition-colors text-black">
                <span className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Images
                </span>
              </Link>
            )}
          </>
        )}
        <Link to="/about" className="text-base font-medium py-2 transition-colors text-black">
          À propos
        </Link>
        
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Rechercher..." className="w-full pl-10 pr-4 py-2 rounded-full bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        
        {user ? (
          <Button variant="destructive" onClick={onLogout} className="mt-4">
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        ) : (
          <Button variant="default" onClick={() => onNavigate('/auth')} className="mt-4">
            <LogIn className="h-4 w-4 mr-2" />
            Connexion
          </Button>
        )}
      </nav>
    </div>
  );
}

export default MobileMenu;
