
import { Link } from 'react-router-dom';
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
  // Le composant DesktopNav n'est plus utilisé car nous avons intégré 
  // la navigation directement dans le composant Header
  return null;
}

export default DesktopNav;
