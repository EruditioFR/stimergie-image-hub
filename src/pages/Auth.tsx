
import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Header } from "@/components/ui/layout/Header";
import { Footer } from "@/components/ui/layout/Footer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Login form schema
const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isResetPasswordLoading, setIsResetPasswordLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // If user is already logged in, redirect to home
  if (user) {
    return <Navigate to="/" replace />;
  }

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      setLoginError(null);
      console.log("Auth page: Attempting login for:", data.email);
      
      await signIn(data.email, data.password);
      
      console.log("Auth page: Login successful");
      setIsOpen(false);
      navigate("/");
      
    } catch (error) {
      console.error("Auth page: Login error:", error);
      // Error message is already shown by the AuthContext
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

  const handleDialogClose = () => {
    setIsOpen(false);
    navigate("/");
  };

  const handleForgotPassword = async () => {
    const email = loginForm.getValues().email;

    if (!email || !z.string().email().safeParse(email).success) {
      toast({
        variant: "destructive",
        title: "Email invalide",
        description: "Veuillez entrer une adresse email valide"
      });
      return;
    }

    try {
      setIsResetPasswordLoading(true);
      
      // Utiliser une URL de redirection plus robuste
      const currentOrigin = window.location.origin;
      const redirectUrl = `${currentOrigin}/reset-password`;
      
      console.log("Sending password reset email to:", email);
      console.log("Redirect URL:", redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      
      if (error) {
        console.error("Reset password error:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error.message
        });
        return;
      }
      
      toast({
        title: "Email envoyé",
        description: "Si cette adresse existe dans notre système, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe. Vérifiez aussi vos spams."
      });
    } catch (error) {
      console.error("Reset password error:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer l'email de réinitialisation"
      });
    } finally {
      setIsResetPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="pb-20 px-6 flex-grow flex items-center justify-center">
        <Dialog open={isOpen} onOpenChange={handleDialogClose}>
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
                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    variant="link" 
                    className="px-0 h-auto text-sm text-muted-foreground"
                    onClick={handleForgotPassword}
                    disabled={isResetPasswordLoading}
                  >
                    {isResetPasswordLoading ? "Envoi en cours..." : "Mot de passe oublié ?"}
                  </Button>
                </div>
                <div className="pt-2">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Connexion en cours..." : "Se connecter"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <Footer />
    </div>
  );
}
