
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Users, LogIn, LogOut, UserCircle, FolderOpen, Settings, LayoutDashboard, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();
  const isHomePage = location.pathname === "/";
  const canAccessClientsPage = userRole === 'admin';
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header 
      className={cn(
        "transition-all duration-300 px-6 py-4 relative",
        isHomePage
          ? isScrolled 
            ? "bg-background/80 backdrop-blur-md text-foreground" 
            : "bg-transparent text-white"
          : "bg-background text-foreground"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link 
          to="/" 
          className="transition-opacity hover:opacity-80"
        >
          <img 
            src="/lovable-uploads/9ce78881-8c65-4716-ab7f-128bb420c8e9.png" 
            alt="Stimergie Logo" 
            className="h-8 w-auto"
          />
        </Link>

        <nav className="hidden md:flex space-x-8 items-center">
          <Link 
            to="/" 
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              location.pathname === "/" ? "text-primary" : "text-foreground/80"
            )}
          >
            Accueil
          </Link>
          {user && (
            <Link 
              to="/gallery" 
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname.includes("/gallery") ? "text-primary" : "text-foreground/80"
              )}
            >
              Banque d'images
            </Link>
          )}
          {user && isAdmin && (
            <NavigationMenu className="z-[10000]">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={cn(
                    "text-sm font-medium transition-colors hover:text-primary bg-transparent",
                    location.pathname === "/clients" || 
                    location.pathname === "/projects" ||
                    location.pathname === "/users" 
                    ? "text-primary" : "text-foreground/80"
                  )}>
                    <span className="flex items-center gap-1">
                      <Settings className="h-4 w-4" />
                      Administrer
                    </span>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="w-screen left-0 p-6 z-[10000]">
                    <div className="max-w-7xl mx-auto grid grid-cols-3 gap-8">
                      <Link 
                        to="/clients" 
                        className={cn(
                          "group flex flex-col items-center gap-4 p-6 rounded-lg transition-all hover:bg-accent",
                          location.pathname === "/clients" ? "bg-accent/50" : ""
                        )}
                      >
                        <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Users className="h-10 w-10 text-primary" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-lg font-medium mb-1">Clients</h3>
                          <p className="text-sm text-muted-foreground">Gérer les clients et leurs informations</p>
                        </div>
                      </Link>
                      
                      <Link 
                        to="/projects" 
                        className={cn(
                          "group flex flex-col items-center gap-4 p-6 rounded-lg transition-all hover:bg-accent",
                          location.pathname === "/projects" ? "bg-accent/50" : ""
                        )}
                      >
                        <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <FolderOpen className="h-10 w-10 text-primary" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-lg font-medium mb-1">Projets</h3>
                          <p className="text-sm text-muted-foreground">Suivre et gérer les projets en cours</p>
                        </div>
                      </Link>
                      
                      <Link 
                        to="/users" 
                        className={cn(
                          "group flex flex-col items-center gap-4 p-6 rounded-lg transition-all hover:bg-accent",
                          location.pathname === "/users" ? "bg-accent/50" : ""
                        )}
                      >
                        <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Users className="h-10 w-10 text-primary" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-lg font-medium mb-1">Utilisateurs</h3>
                          <p className="text-sm text-muted-foreground">Gérer les utilisateurs et leurs droits</p>
                        </div>
                      </Link>
                      
                      <Link 
                        to="/dashboard" 
                        className="group flex flex-col items-center gap-4 p-6 rounded-lg transition-all hover:bg-accent"
                      >
                        <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <LayoutDashboard className="h-10 w-10 text-primary" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-lg font-medium mb-1">Tableau de bord</h3>
                          <p className="text-sm text-muted-foreground">Aperçu des statistiques et activités</p>
                        </div>
                      </Link>
                      
                      <Link 
                        to="/global" 
                        className="group flex flex-col items-center gap-4 p-6 rounded-lg transition-all hover:bg-accent"
                      >
                        <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Globe className="h-10 w-10 text-primary" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-lg font-medium mb-1">Vue globale</h3>
                          <p className="text-sm text-muted-foreground">Aperçu global de toutes les activités</p>
                        </div>
                      </Link>
                      
                      <Link 
                        to="/settings" 
                        className="group flex flex-col items-center gap-4 p-6 rounded-lg transition-all hover:bg-accent"
                      >
                        <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Settings className="h-10 w-10 text-primary" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-lg font-medium mb-1">Paramètres</h3>
                          <p className="text-sm text-muted-foreground">Configuration et personnalisation</p>
                        </div>
                      </Link>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          )}
          <Link 
            to="/about" 
            className="text-sm font-medium transition-colors hover:text-primary text-foreground/80"
          >
            À propos
          </Link>
          <Button variant="ghost" size="icon" className="ml-2">
            <Search className="h-4 w-4" />
          </Button>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-2 rounded-full">
                  <UserCircle className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[10000]">
                <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">Profil</Link>
                </DropdownMenuItem>
                {canAccessClientsPage && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/clients" className="cursor-pointer">Clients</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/projects" className="cursor-pointer">Projets</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/users" className="cursor-pointer">Utilisateurs</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500">
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" size="sm" onClick={() => navigate('/auth')} className="ml-2">
              <LogIn className="h-4 w-4 mr-2" />
              Connexion
            </Button>
          )}
        </nav>

        <div className="md:hidden flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-lg shadow-lg animate-fade-in z-[10000]">
          <nav className="flex flex-col p-6 space-y-4">
            <div className="flex justify-center mb-4">
              <img 
                src="/lovable-uploads/9ce78881-8c65-4716-ab7f-128bb420c8e9.png" 
                alt="Stimergie Logo" 
                className="h-8 w-auto"
              />
            </div>
            
            <Link 
              to="/" 
              className={cn(
                "text-base font-medium py-2 transition-colors",
                location.pathname === "/" ? "text-primary" : "text-foreground/80"
              )}
            >
              Accueil
            </Link>
            {user && (
              <Link 
                to="/gallery" 
                className={cn(
                  "text-base font-medium py-2 transition-colors",
                  location.pathname.includes("/gallery") ? "text-primary" : "text-foreground/80"
                )}
              >
                Banque d'images
              </Link>
            )}
            {user && isAdmin && (
              <div className="py-2">
                <div className="flex items-center gap-2 text-base font-medium mb-2">
                  <Settings className="h-4 w-4" />
                  <span>Administrer</span>
                </div>
                <div className="pl-6 space-y-2 border-l-2 border-border">
                  <Link 
                    to="/clients" 
                    className={cn(
                      "flex items-center gap-2 py-2 text-sm font-medium",
                      location.pathname === "/clients" ? "text-primary" : "text-foreground/80"
                    )}
                  >
                    <Users className="h-4 w-4" />
                    Clients
                  </Link>
                  <Link 
                    to="/projects" 
                    className={cn(
                      "flex items-center gap-2 py-2 text-sm font-medium",
                      location.pathname === "/projects" ? "text-primary" : "text-foreground/80"
                    )}
                  >
                    <FolderOpen className="h-4 w-4" />
                    Projets
                  </Link>
                  <Link 
                    to="/users" 
                    className={cn(
                      "flex items-center gap-2 py-2 text-sm font-medium",
                      location.pathname === "/users" ? "text-primary" : "text-foreground/80"
                    )}
                  >
                    <Users className="h-4 w-4" />
                    Utilisateurs
                  </Link>
                </div>
              </div>
            )}
            <Link 
              to="/about" 
              className="text-base font-medium py-2 transition-colors text-foreground/80"
            >
              À propos
            </Link>
            
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="w-full pl-10 pr-4 py-2 rounded-full bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            
            {user ? (
              <Button variant="destructive" onClick={handleLogout} className="mt-4">
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            ) : (
              <Button variant="default" onClick={() => navigate('/auth')} className="mt-4">
                <LogIn className="h-4 w-4 mr-2" />
                Connexion
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
