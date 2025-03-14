
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
import { ChevronDown, Lock, LogOut, Settings, UserCircle } from "lucide-react";
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

  const initials = userProfile?.firstName && userProfile?.lastName
    ? `${userProfile.firstName[0]}${userProfile.lastName[0]}`.toUpperCase()
    : user.email ? user.email[0].toUpperCase() : "U";

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
                {userProfile?.firstName} {userProfile?.lastName}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatRole(userProfile?.role || userRole)}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm md:hidden">
            <p className="font-medium leading-none">{userProfile?.firstName} {userProfile?.lastName}</p>
            <p className="text-xs text-muted-foreground pt-0.5">{formatRole(userProfile?.role || userRole)}</p>
          </div>
          <DropdownMenuSeparator className="md:hidden" />
          <DropdownMenuItem className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            <span>Mon profil</span>
          </DropdownMenuItem>
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
