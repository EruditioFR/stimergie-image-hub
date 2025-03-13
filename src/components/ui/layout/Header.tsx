
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Users, LogIn, LogOut, UserCircle, FolderOpen, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from '@/integrations/supabase/client';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userProfile, setUserProfile] = useState<{ firstName: string; lastName: string; role: string } | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    userRole,
    signOut
  } = useAuth();

  const isHomePage = location.pathname === "/";
  const canAccessClientsPage = userRole === 'admin';
  const canAccessImagesPage = userRole === 'admin' || userRole === 'admin_client';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    handleScroll();
    handleResize();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Fetch user profile data
  useEffect(() => {
    if (user) {
      const fetchProfileData = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('first_name, last_name, role')
            .eq('id', user.id)
            .single();
            
          if (data && !error) {
            setUserProfile({
              firstName: data.first_name || '',
              lastName: data.last_name || '',
              role: data.role || 'utilisateur'
            });
          } else {
            console.error('Error fetching profile:', error);
            
            // Fallback: use metadata from user object
            setUserProfile({
              firstName: user.user_metadata?.first_name || '',
              lastName: user.user_metadata?.last_name || '',
              role: userRole || 'utilisateur'
            });
          }
        } catch (err) {
          console.error('Unexpected error fetching profile:', err);
        }
      };
      
      fetchProfileData();
    }
  }, [user, userRole]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const formatRole = (role: string) => {
    // Convert API role names to user-friendly display names
    switch(role.toLowerCase()) {
      case 'admin': return 'Administrateur';
      case 'admin_client': return 'Admin Client';
      case 'user': return 'Utilisateur';
      default: return role;
    }
  };

  return <header className={cn("transition-all duration-300 px-6 py-4", 
    isHomePage ? isScrolled ? "bg-background/80 backdrop-blur-md" : "bg-transparent" : "bg-background")}>
      <div className="max-w-7xl mx-auto flex items-center justify-between py-[39px]">
        <Link to="/" className="transition-opacity hover:opacity-80">
          <img src="/lovable-uploads/9ce78881-8c65-4716-ab7f-128bb420c8e9.png" alt="Stimergie Logo" className="h-8 w-auto" />
        </Link>

        <nav className="hidden md:flex space-x-8 items-center">
          <Link to="/" className={cn("text-sm font-medium transition-colors hover:text-primary text-black", 
            location.pathname === "/" ? "text-primary" : "")}>
            Accueil
          </Link>
          {user && <Link to="/gallery" className={cn("text-sm font-medium transition-colors hover:text-primary text-black", 
            location.pathname.includes("/gallery") ? "text-primary" : "")}>
              Banque d'images
            </Link>}
          {user && <>
              {canAccessClientsPage && <Link to="/clients" className={cn("text-sm font-medium transition-colors hover:text-primary text-black", 
                location.pathname === "/clients" ? "text-primary" : "")}>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Clients
                  </span>
                </Link>}
              <Link to="/projects" className={cn("text-sm font-medium transition-colors hover:text-primary text-black", 
                location.pathname === "/projects" ? "text-primary" : "")}>
                <span className="flex items-center gap-1">
                  <FolderOpen className="h-4 w-4" />
                  Projets
                </span>
              </Link>
              <Link to="/users" className={cn("text-sm font-medium transition-colors hover:text-primary text-black", 
                location.pathname === "/users" ? "text-primary" : "")}>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Utilisateurs
                </span>
              </Link>
              {canAccessImagesPage && <Link to="/images" className={cn("text-sm font-medium transition-colors hover:text-primary text-black", 
                location.pathname === "/images" ? "text-primary" : "")}>
                <span className="flex items-center gap-1">
                  <Image className="h-4 w-4" />
                  Images
                </span>
              </Link>}
            </>}
          <Link to="/about" className="text-sm font-medium transition-colors hover:text-primary text-black">
            À propos
          </Link>
          <Button variant="ghost" size="icon" className="ml-2">
            <Search className="h-4 w-4" />
          </Button>
          
          {user ? <DropdownMenu>
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
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer text-black">Profil</Link>
                </DropdownMenuItem>
                {canAccessClientsPage && <DropdownMenuItem asChild>
                    <Link to="/clients" className="cursor-pointer text-black">Clients</Link>
                  </DropdownMenuItem>}
                <DropdownMenuItem asChild>
                  <Link to="/projects" className="cursor-pointer text-black">Projets</Link>
                </DropdownMenuItem>
                {canAccessImagesPage && <DropdownMenuItem asChild>
                  <Link to="/images" className="cursor-pointer text-black">Images</Link>
                </DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500">
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> : <Button variant="default" size="sm" onClick={() => navigate('/auth')} className="ml-2">
              <LogIn className="h-4 w-4 mr-2" />
              Connexion
            </Button>}
        </nav>

        <div className="md:hidden flex items-center">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}>
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-lg shadow-lg animate-fade-in z-50">
          <nav className="flex flex-col p-6 space-y-4">
            <div className="flex justify-center mb-4">
              <img src="/lovable-uploads/9ce78881-8c65-4716-ab7f-128bb420c8e9.png" alt="Stimergie Logo" className="h-8 w-auto" />
            </div>
            
            {userProfile && (
              <div className="text-center mb-4 py-2 border-b border-gray-100">
                <div className="font-medium">{userProfile.firstName} {userProfile.lastName}</div>
                <div className="text-sm text-muted-foreground">{formatRole(userProfile.role)}</div>
              </div>
            )}
            
            <Link to="/" className={cn("text-base font-medium py-2 transition-colors text-black", location.pathname === "/" ? "text-primary" : "")}>
              Accueil
            </Link>
            {user && <Link to="/gallery" className="text-base font-medium py-2 transition-colors text-black">
                Banque d'images
              </Link>}
            {user && <>
                {canAccessClientsPage && <Link to="/clients" className="text-base font-medium py-2 transition-colors text-black">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Clients
                    </span>
                  </Link>}
                <Link to="/projects" className="text-base font-medium py-2 transition-colors text-black">
                  <span className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Projets
                  </span>
                </Link>
                <Link to="/users" className="text-base font-medium py-2 transition-colors text-black">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Utilisateurs
                  </span>
                </Link>
                {canAccessImagesPage && <Link to="/images" className="text-base font-medium py-2 transition-colors text-black">
                  <span className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Images
                  </span>
                </Link>}
              </>}
            <Link to="/about" className="text-base font-medium py-2 transition-colors text-black">
              À propos
            </Link>
            
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" placeholder="Rechercher..." className="w-full pl-10 pr-4 py-2 rounded-full bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            
            {user ? <Button variant="destructive" onClick={handleLogout} className="mt-4">
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button> : <Button variant="default" onClick={() => navigate('/auth')} className="mt-4">
                <LogIn className="h-4 w-4 mr-2" />
                Connexion
              </Button>}
          </nav>
        </div>}
    </header>;
}

export default Header;
