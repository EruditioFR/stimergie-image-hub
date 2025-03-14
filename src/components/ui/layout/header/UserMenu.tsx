
import { useAuth } from "@/context/AuthContext";
import { useUserProfile, formatRole } from "@/hooks/useUserProfile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Lock, LogOut, Settings, UserCircle, Building2 } from "lucide-react";
import { useState } from "react";
import { ChangePasswordForm } from "@/components/users/ChangePasswordForm";
import { useNavigate } from "react-router-dom";

export function UserMenu() {
  const { user, userRole, signOut } = useAuth();
  const userProfile = useUserProfile(user, userRole);
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  // If there's no user, don't render anything
  if (!user) return null;

  // Safely get initials
  const getInitials = () => {
    const firstName = userProfile?.firstName || '';
    const lastName = userProfile?.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName[0].toUpperCase();
    } else if (user.email) {
      return user.email[0].toUpperCase();
    }
    
    return "U"; // Default fallback
  };

  const initials = getInitials();
  const displayName = userProfile?.firstName && userProfile?.lastName 
    ? `${userProfile.firstName} ${userProfile.lastName}` 
    : user.email?.split('@')[0] || 'Utilisateur';
  const displayRole = formatRole(userProfile?.role || userRole);

  return (
    <>
      {showChangePasswordForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md mx-auto">
            <ChangePasswordForm onCancel={() => setShowChangePasswordForm(false)} />
          </div>
        </div>
      ) : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 flex items-center">
            <Avatar className="h-8 w-8 border">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium leading-none">
                {displayName}
              </span>
              <span className="text-xs text-muted-foreground">
                {displayRole}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm md:hidden">
            <p className="font-medium leading-none">{displayName}</p>
            <p className="text-xs text-muted-foreground pt-0.5">{displayRole}</p>
            {userProfile?.clientId && (
              <p className="text-xs text-muted-foreground pt-0.5 flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Client ID: {userProfile.clientId}
              </p>
            )}
          </div>
          <DropdownMenuSeparator className="md:hidden" />
          <DropdownMenuItem className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            <span>Mon profil</span>
          </DropdownMenuItem>
          {userProfile?.clientId && (
            <DropdownMenuItem className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>Mon client: {userProfile.clientId}</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className="flex items-center gap-2" onSelect={() => setShowChangePasswordForm(true)}>
            <Lock className="h-4 w-4" />
            <span>Changer de mot de passe</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Paramètres</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex items-center gap-2" onSelect={handleLogout}>
            <LogOut className="h-4 w-4" />
            <span>Déconnexion</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
