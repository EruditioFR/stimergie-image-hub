
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

// Login form schema
const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
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
    return <Navigate to="/" />;
  }

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      setLoginError(null);
      await signIn(data.email, data.password);
      setIsOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("Email ou mot de passe incorrect");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = () => {
    setIsOpen(false);
    navigate("/");
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
