
import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

import { DesktopNav } from './header/DesktopNav';
import { MobileMenu } from './header/MobileMenu';
import { useUserProfile, formatRole } from '@/hooks/useUserProfile';
import { useHeaderState } from '@/hooks/useHeaderState';

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

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <header 
      className={cn(
        "transition-all duration-300 px-6 py-4", 
        isHomePage ? isScrolled ? "bg-background/80 backdrop-blur-md" : "bg-transparent" : "bg-background"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between py-[39px]">
        <Link to="/" className="transition-opacity hover:opacity-80">
          <img 
            src="/lovable-uploads/9ce78881-8c65-4716-ab7f-128bb420c8e9.png" 
            alt="Stimergie Logo" 
            className="h-8 w-auto" 
          />
        </Link>

        <DesktopNav
          location={location}
          user={user}
          userProfile={userProfile}
          canAccessClientsPage={canAccessClientsPage}
          canAccessImagesPage={canAccessImagesPage}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          formatRole={formatRole}
        />

        <div className="md:hidden flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleMobileMenu} 
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        userProfile={userProfile}
        location={location}
        user={user}
        canAccessClientsPage={canAccessClientsPage}
        canAccessImagesPage={canAccessImagesPage}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        formatRole={formatRole}
      />
    </header>
  );
}

export default Header;
