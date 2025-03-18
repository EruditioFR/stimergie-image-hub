
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
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Login form schema
const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Index() {
  const { user, loading: authLoading, signIn } = useAuth();
  const { dashboardType, loading: dataLoading } = useDashboardData();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const navigate = useNavigate();
  
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
      
      await signIn(data.email, data.password);
      
      console.log("Home page: Login successful");
      
    } catch (error) {
      console.error("Home page: Login error:", error);
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

  // Déterminer quel tableau de bord afficher
  const renderDashboard = () => {
    // Si l'utilisateur n'est pas connecté, afficher la page de connexion
    if (!user) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[75vh] px-6">
          <div className="w-full max-w-sm mx-auto mb-8">
            <img 
              src="/lovable-uploads/9ce78881-8c65-4716-ab7f-128bb420c8e9.png" 
              alt="Stimergie Logo" 
              className="h-40 w-auto mx-auto"
            />
          </div>
          
          <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center">Connexion</h2>
            
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
                    onClick={() => navigate("/reset-password")}
                  >
                    Mot de passe oublié ?
                  </Button>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Connexion en cours..." : "Se connecter"}
                </Button>
              </form>
            </Form>
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

    // Afficher le tableau de bord approprié selon le rôle
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {authLoading ? (
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          renderDashboard()
        )}
      </main>
      <Footer />
    </div>
  );
}
