
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  show: boolean;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  role: string;
}

interface MobileMenuProps {
  location: { pathname: string };
  navigationItems: NavigationItem[];
  user: any;
  userProfile: UserProfile | null;
  onLogout: () => Promise<void>;
  onNavigate: (path: string) => void;
  formatRole: (role: string) => string;
}

export function MobileMenu({
  location,
  navigationItems,
  user,
  userProfile,
  onLogout,
  onNavigate,
  formatRole
}: MobileMenuProps) {
  const filteredNavItems = navigationItems.filter(item => item.show);

  return (
    <div className="flex flex-col space-y-2">
      {userProfile && (
        <div className="text-center mb-4 py-2 border-b border-gray-100">
          <div className="font-medium">{userProfile.firstName} {userProfile.lastName}</div>
          <div className="text-sm text-muted-foreground">{formatRole(userProfile.role)}</div>
        </div>
      )}
      
      {filteredNavItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link 
            key={item.path}
            to={item.path} 
            className={cn(
              "flex items-center space-x-2 text-base font-medium py-2 px-2 rounded transition-colors",
              location.pathname === item.path
                ? "text-primary bg-primary/10"
                : "text-foreground hover:text-primary hover:bg-primary/5"
            )}
            onClick={() => onNavigate(item.path)}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
      
      {user && (
        <Button variant="destructive" onClick={onLogout} className="mt-4">
          Déconnexion
        </Button>
      )}
    </div>
  );
}

export default MobileMenu;
