
import { UserCircle, LogOut, Users, FolderOpen, Image } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface UserProfile {
  firstName: string;
  lastName: string;
  role: string;
}

interface UserMenuProps {
  userProfile: UserProfile | null;
  canAccessClientsPage: boolean;
  canAccessImagesPage: boolean;
  onLogout: () => Promise<void>;
  formatRole: (role: string) => string;
}

export function UserMenu({ 
  userProfile, 
  canAccessClientsPage, 
  canAccessImagesPage,
  onLogout,
  formatRole
}: UserMenuProps) {
  // Determine if user has admin or admin_client role
  const isAdmin = userProfile?.role === 'admin';
  const isAdminClient = userProfile?.role === 'admin_client';
  const hasEditAccess = isAdmin || isAdminClient;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="ml-2 rounded-full">
          <UserCircle className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="text-black">
        <DropdownMenuLabel>
          {userProfile ? (
            <div className="flex flex-col gap-1">
              <div className="font-medium">{userProfile.firstName} {userProfile.lastName}</div>
              <div className="text-xs text-muted-foreground">{formatRole(userProfile.role)}</div>
            </div>
          ) : (
            "Mon compte"
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Profile link - available to all users */}
        <DropdownMenuItem asChild>
          <Link to="/profile" className="cursor-pointer text-black">Profil</Link>
        </DropdownMenuItem>
        
        {/* Admin-only access to Clients page */}
        {canAccessClientsPage && (
          <DropdownMenuItem asChild>
            <Link to="/clients" className="cursor-pointer text-black">Clients</Link>
          </DropdownMenuItem>
        )}
        
        {/* Access to Users page for admins and admin_clients */}
        {hasEditAccess && (
          <DropdownMenuItem asChild>
            <Link to="/users" className="cursor-pointer text-black">Utilisateurs</Link>
          </DropdownMenuItem>
        )}
        
        {/* Access to Projects page for admins and admin_clients */}
        {hasEditAccess && (
          <DropdownMenuItem asChild>
            <Link to="/projects" className="cursor-pointer text-black">Projets</Link>
          </DropdownMenuItem>
        )}
        
        {/* Access to Images page for admins and admin_clients */}
        {canAccessImagesPage && (
          <DropdownMenuItem asChild>
            <Link to="/images" className="cursor-pointer text-black">Images</Link>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-500">
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
