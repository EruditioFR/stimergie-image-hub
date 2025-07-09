
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Users, Image, FolderOpen, User, Settings, Shield, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { UserMenu } from './header/UserMenu';
import { MobileMenu } from './header/MobileMenu';
import { useUserProfile } from '@/hooks/useUserProfile';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut, isAdmin, isAdminClient } = useAuth();
  const { userProfile } = useUserProfile(user, userRole);

  const canAccessClientsPage = isAdmin();
  const canAccessImagesPage = isAdmin();
  const canAccessUsersPage = isAdmin();
  const canAccessAccessPeriodsPage = isAdmin();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const formatRole = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'admin_client':
        return 'Admin Client';
      case 'user':
        return 'Utilisateur';
      default:
        return role;
    }
  };

  // Navigation items
  const navigationItems = [
    {
      path: '/gallery',
      label: 'Galerie',
      icon: Image,
      show: true
    },
    {
      path: '/projects',
      label: 'Projets',
      icon: FolderOpen,
      show: true
    },
    {
      path: '/clients',
      label: 'Clients',
      icon: Users,
      show: canAccessClientsPage
    },
    {
      path: '/images',
      label: 'Images',
      icon: Image,
      show: canAccessImagesPage
    },
    {
      path: '/users',
      label: 'Utilisateurs',
      icon: User,
      show: canAccessUsersPage
    },
    {
      path: '/access-periods',
      label: 'Droits d\'accès',
      icon: Shield,
      show: canAccessAccessPeriodsPage
    },
    {
      path: '/downloads',
      label: 'Téléchargements',
      icon: Download,
      show: true
    }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              Banque d'images
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navigationItems
              .filter(item => item.show)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "transition-colors hover:text-foreground/80 flex items-center space-x-2",
                      location.pathname === item.path
                        ? "text-foreground"
                        : "text-foreground/60"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
          </nav>
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <MobileMenu
              location={location}
              navigationItems={navigationItems}
              user={user}
              userProfile={userProfile}
              onLogout={handleLogout}
              onNavigate={handleNavigate}
              formatRole={formatRole}
            />
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none md:hidden">
            <Link to="/" className="flex items-center space-x-2">
              <span className="font-bold">Banque d'images</span>
            </Link>
          </div>
          <nav className="flex items-center">
            <UserMenu
              user={user}
              userProfile={userProfile}
              onLogout={handleLogout}
              formatRole={formatRole}
            />
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
