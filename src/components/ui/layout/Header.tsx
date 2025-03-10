
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Users, LogIn, LogOut, UserCircle } from 'lucide-react';
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

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

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
        "fixed left-0 right-0 z-40 transition-all duration-300 px-6 py-4",
        isScrolled 
          ? "bg-background/80 backdrop-blur-md shadow-sm" 
          : "bg-transparent",
        user ? "top-7" : "top-0"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link 
          to="/" 
          className={cn(
            "text-2xl font-semibold tracking-tight transition-colors",
            isScrolled ? "text-foreground" : "text-white"
          )}
        >
          Stimergie
        </Link>

        <nav className="hidden md:flex space-x-8 items-center">
          <Link 
            to="/" 
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              location.pathname === "/" 
                ? (isScrolled ? "text-primary" : "text-white") 
                : (isScrolled ? "text-foreground/80" : "text-white/80")
            )}
          >
            Accueil
          </Link>
          <Link 
            to="/gallery" 
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              location.pathname.includes("/gallery") 
                ? (isScrolled ? "text-primary" : "text-white") 
                : (isScrolled ? "text-foreground/80" : "text-white/80")
            )}
          >
            Galerie
          </Link>
          <Link 
            to="/categories" 
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              isScrolled ? "text-foreground/80" : "text-white/80"
            )}
          >
            Catégories
          </Link>
          <Link 
            to="/about" 
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              isScrolled ? "text-foreground/80" : "text-white/80"
            )}
          >
            À propos
          </Link>
          {user && (
            <>
              <Link 
                to="/clients" 
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === "/clients" 
                    ? (isScrolled ? "text-primary" : "text-white") 
                    : (isScrolled ? "text-foreground/80" : "text-white/80")
                )}
              >
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Clients
                </span>
              </Link>
              <Link 
                to="/users" 
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === "/users" 
                    ? (isScrolled ? "text-primary" : "text-white") 
                    : (isScrolled ? "text-foreground/80" : "text-white/80")
                )}
              >
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Utilisateurs
                </span>
              </Link>
            </>
          )}
          <Button variant="ghost" size="icon" className={cn(
            "ml-2",
            isScrolled ? "" : "text-white hover:bg-white/10 hover:text-white"
          )}>
            <Search className="h-4 w-4" />
          </Button>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "ml-2 rounded-full",
                    isScrolled ? "" : "text-white hover:bg-white/10 hover:text-white"
                  )}
                >
                  <UserCircle className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">Profil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/clients" className="cursor-pointer">Clients</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500">
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              variant={isScrolled ? "default" : "outline"} 
              size="sm" 
              onClick={() => navigate('/auth')} 
              className={cn(
                "ml-2",
                !isScrolled && "border-white text-white hover:bg-white/10"
              )}
            >
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
            className={cn(
              !isScrolled && "text-white hover:bg-white/10 hover:text-white"
            )}
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
        <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-lg shadow-lg animate-fade-in">
          <nav className="flex flex-col p-6 space-y-4">
            <Link 
              to="/" 
              className={cn(
                "text-base font-medium py-2 transition-colors",
                location.pathname === "/" ? "text-primary" : "text-foreground/80"
              )}
            >
              Accueil
            </Link>
            <Link 
              to="/gallery" 
              className={cn(
                "text-base font-medium py-2 transition-colors",
                location.pathname.includes("/gallery") ? "text-primary" : "text-foreground/80"
              )}
            >
              Galerie
            </Link>
            <Link 
              to="/categories" 
              className="text-base font-medium py-2 transition-colors text-foreground/80"
            >
              Catégories
            </Link>
            <Link 
              to="/about" 
              className="text-base font-medium py-2 transition-colors text-foreground/80"
            >
              À propos
            </Link>
            {user && (
              <>
                <Link 
                  to="/clients" 
                  className={cn(
                    "text-base font-medium py-2 transition-colors",
                    location.pathname === "/clients" ? "text-primary" : "text-foreground/80"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Clients
                  </span>
                </Link>
                <Link 
                  to="/users" 
                  className={cn(
                    "text-base font-medium py-2 transition-colors",
                    location.pathname === "/users" ? "text-primary" : "text-foreground/80"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Utilisateurs
                  </span>
                </Link>
              </>
            )}
            
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
