
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

// Email form schema for requesting password reset
const requestResetSchema = z.object({
  email: z.string().email("L'adresse email est invalide"),
});

// Password reset form schema with new passwords
const resetPasswordSchema = z.object({
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string().min(6, "Veuillez confirmer votre mot de passe"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type RequestResetFormValues = z.infer<typeof requestResetSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidResetLink, setIsValidResetLink] = useState(false);
  const [isCheckingLink, setIsCheckingLink] = useState(true);
  const navigate = useNavigate();

  // Get the parameters from URL
  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");
  const type = searchParams.get("type");

  useEffect(() => {
    const checkResetLink = async () => {
      setIsCheckingLink(true);
      console.log("Checking reset link parameters:", { type, accessToken: !!accessToken, refreshToken: !!refreshToken });
      
      // Check if we have valid reset parameters
      if (type === "recovery" && accessToken) {
        try {
          console.log("Setting session with recovery token");
          
          // Set the session with the recovery token
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (error) {
            console.error("Error setting session:", error);
            setError("Lien de réinitialisation invalide ou expiré. Veuillez demander un nouveau lien.");
            setIsValidResetLink(false);
          } else if (data.session) {
            console.log("Session set successfully for password reset");
            setIsValidResetLink(true);
          } else {
            setError("Lien de réinitialisation invalide. Veuillez demander un nouveau lien.");
            setIsValidResetLink(false);
          }
        } catch (err) {
          console.error("Error processing reset link:", err);
          setError("Erreur lors du traitement du lien de réinitialisation.");
          setIsValidResetLink(false);
        }
      } else {
        // No recovery token, user came here to request a reset
        console.log("No recovery parameters found, showing request form");
        setIsValidResetLink(false);
      }
      
      setIsCheckingLink(false);
    };

    checkResetLink();
  }, [accessToken, refreshToken, type]);

  // Request reset form (when no token is present)
  const requestForm = useForm<RequestResetFormValues>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: {
      email: "",
    },
  });

  // Password reset form (when token is present)
  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onRequestReset = async (data: RequestResetFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const redirectUrl = `https://www.stimergie.fr/reset-password`;
      
      console.log("Sending reset email to:", data.email);
      console.log("Redirect URL:", redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: redirectUrl,
      });
      
      if (error) {
        console.error("Error sending reset email:", error);
        setError(`Erreur lors de l'envoi de l'email: ${error.message}`);
        return;
      }
      
      setSuccess(true);
      toast({
        title: "Email envoyé",
        description: "Si cette adresse existe dans notre système, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe. Vérifiez aussi vos spams."
      });
      
    } catch (err) {
      console.error("Error sending reset email:", err);
      setError("Une erreur inattendue est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPassword = async (data: ResetPasswordFormValues) => {
    if (!isValidResetLink) {
      setError("Lien de réinitialisation invalide ou expiré. Veuillez demander un nouveau lien.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log("Updating user password");
      
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

  if (isCheckingLink) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-grow flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Vérification du lien...</h1>
              <div className="mt-4 flex justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Réinitialisation du mot de passe</h1>
            <p className="mt-2 text-gray-600">
              {isValidResetLink
                ? "Créez un nouveau mot de passe pour votre compte"
                : "Entrez votre adresse email pour recevoir un lien de réinitialisation"}
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && !isValidResetLink ? (
            <div className="p-4 bg-green-50 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Email envoyé ! Vérifiez votre boîte de réception (et vos spams) pour le lien de réinitialisation.
                  </p>
                </div>
              </div>
            </div>
          ) : success ? (
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
          ) : isValidResetLink ? (
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-6">
                <FormField
                  control={resetForm.control}
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
                  control={resetForm.control}
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
            <Form {...requestForm}>
              <form onSubmit={requestForm.handleSubmit(onRequestReset)} className="space-y-6">
                <FormField
                  control={requestForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="exemple@email.com" {...field} />
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
                  {isLoading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
                </Button>
                
                <Button variant="outline" onClick={() => navigate("/auth")} className="w-full mt-4">
                  Retour à la connexion
                </Button>
              </form>
            </Form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
