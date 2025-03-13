
import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Image, FileText, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile, formatRole } from '@/hooks/useUserProfile';
import { useHeaderState } from '@/hooks/useHeaderState';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from '@/components/ui/navigation-menu';
import { UserMenu } from './header/UserMenu';

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();
  
  const userProfile = useUserProfile(user, userRole);
  const { isScrolled, isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useHeaderState();

  const isHomePage = location.pathname === "/";
  const canAccessClientsPage = userRole === 'admin';
  const canAccessImagesPage = userRole === 'admin' || userRole === 'admin_client';

  useEffect(() => {
    closeMobileMenu();
  }, [location, closeMobileMenu]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navigationItems = [
    { name: 'Accueil', path: '/', icon: <Home className="h-4 w-4 mr-2" /> },
    { name: 'Banque d\'images', path: '/gallery', icon: <Image className="h-4 w-4 mr-2" /> },
    { name: 'Ressources', path: '/resources', icon: <FileText className="h-4 w-4 mr-2" /> },
    { name: 'Ensemble', path: '/projects', icon: <Users className="h-4 w-4 mr-2" /> },
    { name: 'Clients', path: '/clients', icon: <Users className="h-4 w-4 mr-2" />, access: canAccessClientsPage },
    { name: 'Administration', path: '/admin', icon: <Settings className="h-4 w-4 mr-2" />, access: canAccessImagesPage }
  ];

  const filteredNavItems = navigationItems.filter(item => 
    !item.hasOwnProperty('access') || item.access === true
  );

  return (
    <header 
      className={cn(
        "transition-all duration-300 px-6 border-b border-gray-200", 
        isHomePage ? isScrolled ? "bg-background/80 backdrop-blur-md" : "bg-transparent" : "bg-background"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between py-2">
        <Link to="/" className="mr-8 transition-opacity hover:opacity-80">
          <img 
            src="/lovable-uploads/9ce78881-8c65-4716-ab7f-128bb420c8e9.png" 
            alt="Stimergie Logo" 
            className="h-8 w-auto" 
          />
        </Link>

        <div className="hidden md:flex flex-1">
          <NavigationMenu className="mx-auto">
            <NavigationMenuList className="space-x-1">
              {filteredNavItems.map((item) => (
                <NavigationMenuItem key={item.name}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                        ? "text-primary"
                        : "text-foreground hover:text-primary hover:bg-accent/50"
                    )}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center">
          {user ? (
            <UserMenu 
              userProfile={userProfile}
              canAccessClientsPage={canAccessClientsPage}
              canAccessImagesPage={canAccessImagesPage}
              onLogout={handleLogout}
              formatRole={formatRole}
            />
          ) : (
            <Button variant="default" size="sm" onClick={() => navigate('/auth')}>
              Connexion
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
