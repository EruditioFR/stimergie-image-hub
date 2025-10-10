
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserMenu } from './header/UserMenu';
import { MobileMenu } from './header/MobileMenu';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ContactForm } from '@/components/contact/ContactForm';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();
  const { userProfile } = useUserProfile(user, userRole);

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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-[#F2F0F0] backdrop-blur">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex items-center">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <img 
              src="/logo_stimergie_header.png" 
              alt="Stimergie" 
              className="h-8 w-auto"
            />
          </Link>
          
          {/* Navigation links */}
          <div className="flex items-center space-x-6">
            <Link 
              to="/gallery" 
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Banque d'images
            </Link>
            <ContactForm userProfile={userProfile} userEmail={user?.email} />
          </div>
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
              <img 
                src="/logo_stimergie_header.png" 
                alt="Stimergie" 
                className="h-6 w-auto"
              />
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
