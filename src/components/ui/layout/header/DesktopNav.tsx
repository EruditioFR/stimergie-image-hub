
import { Link } from 'react-router-dom';
import { Search, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UserMenu } from './UserMenu';

interface UserProfile {
  firstName: string;
  lastName: string;
  role: string;
}

interface DesktopNavProps {
  location: { pathname: string };
  user: any;
  userProfile: UserProfile | null;
  canAccessClientsPage: boolean;
  canAccessImagesPage: boolean;
  onLogout: () => Promise<void>;
  onNavigate: (path: string) => void;
  formatRole: (role: string) => string;
}

export function DesktopNav({
  location,
  user,
  userProfile,
  canAccessClientsPage,
  canAccessImagesPage,
  onLogout,
  onNavigate,
  formatRole
}: DesktopNavProps) {
  return (
    <nav className="hidden md:flex space-x-8 items-center">
      <Link to="/" className={cn("text-sm font-medium transition-colors hover:text-primary text-black", 
        location.pathname === "/" ? "text-primary" : "")}>
        Accueil
      </Link>
      {user && (
        <Link to="/gallery" className={cn("text-sm font-medium transition-colors hover:text-primary text-black", 
          location.pathname.includes("/gallery") ? "text-primary" : "")}>
          Banque d'images
        </Link>
      )}
      <Link to="/about" className="text-sm font-medium transition-colors hover:text-primary text-black">
        À propos
      </Link>
      <Button variant="ghost" size="icon" className="ml-2">
        <Search className="h-4 w-4" />
      </Button>
      
      {user ? (
        <UserMenu 
          userProfile={userProfile}
          canAccessClientsPage={canAccessClientsPage}
          canAccessImagesPage={canAccessImagesPage}
          onLogout={onLogout}
          formatRole={formatRole}
        />
      ) : (
        <Button variant="default" size="sm" onClick={() => onNavigate('/auth')} className="ml-2">
          <LogIn className="h-4 w-4 mr-2" />
          Connexion
        </Button>
      )}
    </nav>
  );
}

export default DesktopNav;
