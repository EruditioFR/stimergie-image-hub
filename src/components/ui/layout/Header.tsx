
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Simulation de l'état admin (à remplacer par votre logique d'authentification réelle)
const isAdmin = true; // Cette valeur serait normalement déterminée par votre système d'authentification

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Close mobile menu when route changes
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
        isScrolled 
          ? "bg-background/80 backdrop-blur-md shadow-sm" 
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link 
          to="/" 
          className="text-2xl font-semibold tracking-tight transition-colors"
        >
          Stimergie
        </Link>

        {/* Desktop Navigation */}
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
          <Link 
            to="/gallery" 
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              location.pathname.includes("/gallery") ? "text-primary" : "text-foreground/80"
            )}
          >
            Galerie
          </Link>
          <Link 
            to="/categories" 
            className="text-sm font-medium transition-colors hover:text-primary text-foreground/80"
          >
            Catégories
          </Link>
          <Link 
            to="/about" 
            className="text-sm font-medium transition-colors hover:text-primary text-foreground/80"
          >
            À propos
          </Link>
          {isAdmin && (
            <Link 
              to="/clients" 
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname === "/clients" ? "text-primary" : "text-foreground/80"
              )}
            >
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Clients
              </span>
            </Link>
          )}
          <Button variant="ghost" size="icon" className="ml-2">
            <Search className="h-4 w-4" />
          </Button>
        </nav>

        {/* Mobile Menu Button */}
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

      {/* Mobile Navigation */}
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
            {isAdmin && (
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
            )}
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="w-full pl-10 pr-4 py-2 rounded-full bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
