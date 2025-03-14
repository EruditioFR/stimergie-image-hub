import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Header } from "@/components/ui/layout/Header";
import { Footer } from "@/components/ui/layout/Footer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Password reset form schema
const resetPasswordSchema = z.object({
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string().min(6, "Veuillez confirmer votre mot de passe"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Get the access token from URL
  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");
  const type = searchParams.get("type");

  // Check if we have a valid reset token in the URL
  const hasValidResetParams = type === "recovery" && (accessToken || refreshToken);

  useEffect(() => {
    // If valid token exists, set the session with the token
    if (hasValidResetParams && accessToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      }).then(({ error }) => {
        if (error) {
          console.error("Error setting session:", error);
          setError("Lien de réinitialisation invalide ou expiré. Veuillez demander un nouveau lien.");
        }
      });
    } else if (!hasValidResetParams) {
      setError("Lien de réinitialisation invalide ou expiré. Veuillez demander un nouveau lien.");
    }
  }, [accessToken, refreshToken, hasValidResetParams]);

  // Password reset form
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!hasValidResetParams) {
      setError("Lien de réinitialisation invalide ou expiré. Veuillez demander un nouveau lien.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Use the updated auth API to change password
      const { error } = await supabase.auth.updateUser({ 
        password: data.password
      });

      if (error) {
        console.error("Error resetting password:", error);
        setError(error.message);
        return;
      }

      setSuccess(true);
      
      toast({
        title: "Mot de passe mis à jour",
        description: "Votre mot de passe a été réinitialisé avec succès."
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/auth");
      }, 3000);
    } catch (err) {
      console.error("Unexpected error during password reset:", err);
      setError("Une erreur inattendue est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = prompt("Veuillez entrer votre adresse email pour recevoir un nouveau lien de réinitialisation:");
    
    if (!email) return;
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password",
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error.message
        });
        return;
      }
      
      toast({
        title: "Email envoyé",
        description: "Vérifiez votre boîte de réception pour le lien de réinitialisation."
      });
    } catch (err) {
      console.error("Error sending reset email:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer l'email de réinitialisation."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Réinitialisation du mot de passe</h1>
            <p className="mt-2 text-gray-600">
              {hasValidResetParams
                ? "Créez un nouveau mot de passe pour votre compte"
                : "Le lien de réinitialisation est invalide ou a expiré"}
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success ? (
            <div className="p-4 bg-green-50 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Mot de passe modifié avec succès ! Vous allez être redirigé vers la page de connexion.
                  </p>
                </div>
              </div>
            </div>
          ) : hasValidResetParams ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nouveau mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmer le mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "Traitement en cours..." : "Réinitialiser le mot de passe"}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <p className="text-center text-gray-600">
                Besoin d'un nouveau lien de réinitialisation ?
              </p>
              <Button onClick={handleForgotPassword} disabled={isLoading}>
                Demander un nouveau lien
              </Button>
              <Button variant="outline" onClick={() => navigate("/auth")} className="mt-4">
                Retour à la connexion
              </Button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
