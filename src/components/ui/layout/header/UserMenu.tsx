
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Download, User, Users, Image, Settings, LogOut } from 'lucide-react';

export function UserMenu() {
  const { user, userRole, signOut } = useAuth();
  const { userProfile, loading: isLoadingProfile } = useUserProfile(user, userRole);
  const [initials, setInitials] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (userProfile?.firstName && userProfile?.lastName) {
      setInitials(`${userProfile.firstName.charAt(0)}${userProfile.lastName.charAt(0)}`);
    } else if (user?.email) {
      setInitials(user.email.charAt(0).toUpperCase());
    }
  }, [userProfile, user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const isAdmin = userRole === 'admin';
  const isAdminClient = userRole === 'admin_client';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="h-8 w-8 border">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {userProfile?.firstName} {userProfile?.lastName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
            {!isLoadingProfile && userRole && (
              <span className="mt-1 inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                {userRole === 'admin' && 'Administrateur'}
                {userRole === 'admin_client' && 'Admin client'}
                {userRole === 'user' && 'Utilisateur'}
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Link to="/downloads" className="flex w-full items-center">
              <Download className="mr-2 h-4 w-4" />
              <span>Vos téléchargements</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profil</span>
          </DropdownMenuItem>

          {(isAdmin || isAdminClient) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link to="/images" className="flex w-full items-center">
                  <Image className="mr-2 h-4 w-4" />
                  <span>Gestion des images</span>
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuItem>
                    <Link to="/clients" className="flex w-full items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Gestion des clients</span>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem>
                <Link to="/users" className="flex w-full items-center">
                  <Users className="mr-2 h-4 w-4" />
                  <span>Gestion des utilisateurs</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Déconnexion</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
