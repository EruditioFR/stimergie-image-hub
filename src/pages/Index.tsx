
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Header } from "@/components/ui/layout/Header";
import { Footer } from "@/components/ui/layout/Footer";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { ClientAdminDashboard } from "@/components/dashboard/ClientAdminDashboard";
import { UserDashboard } from "@/components/dashboard/UserDashboard";
import { useAuth } from "@/context/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ImagePatchwork } from "@/components/home/ImagePatchwork";

// Login form schema
const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Index() {
  const { user, loading: authLoading, signIn, userRole } = useAuth();
  const { dashboardType, loading: dataLoading } = useDashboardData();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const navigate = useNavigate();
  
  // Redirect users with "user" role to gallery
  useEffect(() => {
    if (user && !authLoading && !dataLoading && userRole === 'user') {
      navigate('/gallery', { replace: true });
    }
  }, [user, authLoading, dataLoading, userRole, navigate]);
  
  // Check for online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      setLoginError(null);
      console.log("Home page: Attempting login for:", data.email);
      
      if (isOffline) {
        throw new Error("Vous êtes hors ligne. Veuillez vérifier votre connexion internet.");
      }
      
      await signIn(data.email, data.password);
      
      console.log("Home page: Login successful");
      
    } catch (error) {
      console.error("Home page: Login error:", error);
      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch") || error.message.includes("network")) {
          setLoginError("Erreur de connexion au serveur. Veuillez vérifier votre connexion internet et réessayer.");
        } else if (error.message.includes("Invalid login credentials")) {
          setLoginError("Email ou mot de passe incorrect");
        } else {
          setLoginError(error.message);
        }
      } else {
        setLoginError("Une erreur s'est produite lors de la connexion");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate("/reset-password");
  };

  // Determine what to display
  const renderContent = () => {
    // If the user isn't logged in, show the patchwork with login overlay
    if (!user) {
      return (
        <div className="min-h-screen relative">
          {/* Background patchwork of images */}
          <div className="fixed inset-0 z-0">
            <ImagePatchwork />
          </div>
          
          {/* Login overlay */}
          <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-sm mx-auto mb-8">
              <img 
                src="/logo_stimergie_baseline_login.jpg" 
                alt="Stimergie - Ne cherchez plus vos visuels, utilisez-les" 
                className="w-full max-w-md mx-auto"
              />
            </div>
            
            <div className="w-full max-w-md bg-white/95 backdrop-blur-sm p-8 rounded-lg shadow-xl">
              <h2 className="text-2xl font-bold mb-6 text-center">Connexion</h2>
              
              {isOffline && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Vous êtes actuellement hors ligne. La connexion ne sera pas possible.
                  </AlertDescription>
                </Alert>
              )}
              
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  {loginError && (
                    <Alert variant="destructive">
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
                  <div className="flex justify-end">
                    <Button 
                      type="button" 
                      variant="link" 
                      className="px-0 h-auto text-sm text-muted-foreground"
                      onClick={handleForgotPassword}
                    >
                      Mot de passe oublié ?
                    </Button>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading || isOffline}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connexion en cours...
                      </>
                    ) : (
                      "Se connecter"
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      );
    }

    // Afficher le loader pendant le chargement des données
    if (dataLoading) {
      return (
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      );
    }

    switch (dashboardType) {
      case "admin":
        return <AdminDashboard />;
      case "admin_client":
        return <ClientAdminDashboard />;
      case "user":
        return <UserDashboard />;
      default:
        return (
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="text-center">
              <h2 className="text-xl font-medium mb-2">Bienvenue sur Stimergie</h2>
              <p>Votre tableau de bord est en cours de chargement...</p>
            </div>
          </div>
        );
    }
  };

  // For logged in users, wrap content in the regular layout
  if (user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          {authLoading ? (
            <div className="flex justify-center items-center min-h-[50vh]">
              <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            renderContent()
          )}
        </main>
        <Footer />
      </div>
    );
  }

  // For logged out users, just render the content (which includes the patchwork and login form)
  return renderContent();
}
