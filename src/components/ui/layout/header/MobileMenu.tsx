
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Users, Image, FolderOpen, User, Settings, Shield, Download, Mail } from 'lucide-react';
import { ContactForm } from '@/components/contact/ContactForm';

interface UserProfile {
  firstName: string;
  lastName: string;
  role: string;
  clientId: string | null;
}

interface MobileMenuProps {
  location: { pathname: string };
  user: any;
  userProfile: UserProfile | null;
  onLogout: () => Promise<void>;
  onNavigate: (path: string) => void;
  formatRole: (role: string) => string;
}

export function MobileMenu({
  location,
  user,
  userProfile,
  onLogout,
  onNavigate,
  formatRole
}: MobileMenuProps) {
  const isAdmin = userProfile?.role === 'admin';
  const isAdminClient = userProfile?.role === 'admin_client';

  const navigationItems = [
    {
      path: '/gallery',
      label: 'Banque d\'images',
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
      path: '/downloads',
      label: 'Téléchargements',
      icon: Download,
      show: true
    }
  ];

  const adminItems = [
    {
      path: '/clients',
      label: 'Clients',
      icon: Users,
      show: isAdmin
    },
    {
      path: '/images',
      label: 'Images',
      icon: Image,
      show: isAdmin || isAdminClient
    },
    {
      path: '/users',
      label: 'Utilisateurs',
      icon: User,
      show: isAdmin || isAdminClient
    },
    {
      path: '/access-periods',
      label: 'Droits d\'accès',
      icon: Shield,
      show: isAdmin
    }
  ];

  const allItems = [...navigationItems, ...adminItems.filter(item => item.show)];

  return (
    <div className="flex flex-col space-y-2">
      {userProfile && (
        <div className="text-center mb-4 py-2 border-b border-gray-100">
          <div className="font-medium">{userProfile.firstName} {userProfile.lastName}</div>
          <div className="text-sm text-muted-foreground">{formatRole(userProfile.role)}</div>
        </div>
      )}
      
      {allItems.map((item) => {
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
      
      {/* Contact Form */}
      <div className="py-2">
        <ContactForm userProfile={userProfile} userEmail={user?.email} />
      </div>
      
      {user && (
        <Button variant="destructive" onClick={onLogout} className="mt-4">
          Déconnexion
        </Button>
      )}
    </div>
  );
}

export default MobileMenu;
