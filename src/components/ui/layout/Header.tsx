import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Image, FileText, Users, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile, formatRole } from '@/hooks/useUserProfile';
import { useHeaderState } from '@/hooks/useHeaderState';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem } from '@/components/ui/navigation-menu';
import { UserMenu } from './header/UserMenu';
import { MobileMenu } from './header/MobileMenu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Login form schema
const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function Header() {
  const location = useLocation();
  
  const { user, userRole, signOut, signIn } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const { userProfile, loading: isLoadingProfile } = useUserProfile(user, userRole);
  const { isScrolled, isMobile, isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useHeaderState();

  const isHomePage = location.pathname === "/";
  
  const isAdmin = userRole === 'admin';
  const isAdminClient = userRole === 'admin_client';
  const canAccessClientsPage = isAdmin;
  const canAccessImagesPage = isAdmin || isAdminClient;

  useEffect(() => {
    closeMobileMenu();
  }, [location, closeMobileMenu]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      setLoginError(null);
      console.log("Header: Attempting sign in for:", data.email);
      
      await signIn(data.email, data.password);
      
      console.log("Header: Login successful");
      setIsLoginModalOpen(false);
      loginForm.reset();
      
    } catch (error) {
      console.error("Header: Login error:", error);
      if (error instanceof Error) {
        setLoginError(error.message.includes("Invalid login credentials") 
          ? "Email ou mot de passe incorrect" 
          : error.message);
      } else {
        setLoginError("Une erreur s'est produite lors de la connexion");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const navigationItems = [
    { name: 'Accueil', path: '/', icon: <Home className="h-4 w-4 mr-2" /> },
    { name: 'Banque d\'images', path: '/gallery', icon: <Image className="h-4 w-4 mr-2" /> },
    { name: 'Ensemble', path: '/ensemble', icon: <Users className="h-4 w-4 mr-2" /> },
    { name: 'Ressources', path: '/resources', icon: <FileText className="h-4 w-4 mr-2" /> }
  ];

  const filteredNavItems = navigationItems;

  return (
    <header 
      className={cn(
        "transition-all duration-300 px-6 border-b border-gray-200", 
        isHomePage ? isScrolled ? "bg-background/80 backdrop-blur-md" : "bg-transparent" : "bg-background"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between py-2">
        <Link to="/" className="mr-8 transition-opacity hover:opacity-80">
          <img 
            src="/lovable-uploads/9ce78881-8c65-4716-ab7f-128bb420c8e9.png" 
            alt="Stimergie Logo" 
            className="h-12 w-auto"
          />
        </Link>

        {user && (
          <div className="hidden md:flex flex-1">
            <NavigationMenu className="mx-auto">
              <NavigationMenuList className="space-x-1">
                {filteredNavItems.map((item) => (
                  <NavigationMenuItem key={item.name}>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                          ? "text-primary"
                          : "text-foreground hover:text-primary hover:bg-accent/50"
                      )}
                    >
                      {item.icon}
                      {item.name}
                    </Link>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        )}

        <div className="flex items-center">
          {user ? (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden mr-2" 
                onClick={toggleMobileMenu}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
              <UserMenu />
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden mr-2" 
                onClick={toggleMobileMenu}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
              <Button variant="default" size="sm" onClick={() => setIsLoginModalOpen(true)}>
                Connexion
              </Button>
            </>
          )}
        </div>
      </div>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        userProfile={userProfile}
        location={location}
        user={user}
        canAccessClientsPage={canAccessClientsPage}
        canAccessImagesPage={canAccessImagesPage}
        onLogout={handleLogout}
        onNavigate={(path: string) => navigate(path)}
        formatRole={formatRole}
      />

      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Bienvenue</DialogTitle>
            <DialogDescription>
              Connectez-vous pour accéder à toutes les fonctionnalités
            </DialogDescription>
          </DialogHeader>
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4 pt-4">
              {loginError && (
                <Alert variant="destructive" className="my-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="exemple@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="pt-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Connexion en cours..." : "Se connecter"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </header>
  );
}

export default Header;
