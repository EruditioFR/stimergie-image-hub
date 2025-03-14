import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'admin' | 'admin_client' | 'user' | string;

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userRole: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Utiliser la fonction RPC pour obtenir le rôle de l'utilisateur
        fetchUserRoleViaRPC(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Utiliser la fonction RPC pour obtenir le rôle de l'utilisateur
          fetchUserRoleViaRPC(session.user.id);
        } else {
          setUserRole('user');
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRoleViaRPC = async (userId: string) => {
    try {
      // Utiliser la fonction RPC get_user_role pour obtenir le rôle sans récursion
      const { data, error } = await supabase.rpc('get_user_role');
      
      if (data && !error) {
        console.log("Rôle récupéré via RPC:", data);
        setUserRole(data || 'user');
      } else {
        console.error("Erreur lors de la récupération du rôle via RPC:", error);
        // Fallback: essayer de récupérer le rôle en utilisant une requête directe
        await fallbackFetchRole(userId);
      }
    } catch (error) {
      console.error("Erreur inattendue lors de la récupération du rôle:", error);
      await fallbackFetchRole(userId);
    } finally {
      setLoading(false);
    }
  };

  // Méthode de secours pour récupérer le rôle en cas d'échec de la RPC
  const fallbackFetchRole = async (userId: string) => {
    try {
      // Utiliser une requête brute SQL avec SELECT auth.uid() pour éviter la récursion
      const { data, error } = await supabase.from('profiles')
        .select('role')
        .filter('id', 'eq', userId)
        .maybeSingle();
      
      if (data && !error) {
        console.log("Rôle récupéré via fallback:", data.role);
        setUserRole(data.role || 'user');
      } else {
        console.error("Erreur lors du fallback pour récupérer le rôle:", error);
        // Dernier recours: utiliser les métadonnées de l'utilisateur
        if (user?.user_metadata?.role) {
          setUserRole(user.user_metadata.role);
        } else {
          setUserRole('user');
        }
      }
    } catch (error) {
      console.error("Erreur inattendue lors du fallback:", error);
      setUserRole('user');
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Error signing in:', error);
        toast({
          title: "Échec de connexion",
          description: "Email ou mot de passe incorrect",
          variant: "destructive"
        });
        throw error;
      }
      
      toast({
        title: "Connecté avec succès",
        description: "Bienvenue sur votre tableau de bord",
      });
      
      // Don't return data to match the Promise<void> type
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        console.error('Error signing up:', error);
        toast({
          title: "Échec d'inscription",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      toast({
        title: "Compte créé avec succès",
        description: "Veuillez vérifier votre e-mail pour confirmer votre inscription",
      });
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        toast({
          title: "Échec de déconnexion",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      toast({
        title: "Déconnecté avec succès",
      });
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (!user) {
        throw new Error("Vous devez être connecté pour changer votre mot de passe");
      }

      // First verify current password by trying to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email as string,
        password: currentPassword,
      });

      if (verifyError) {
        toast({
          title: "Erreur",
          description: "Le mot de passe actuel est incorrect",
          variant: "destructive"
        });
        throw new Error("Le mot de passe actuel est incorrect");
      }

      // Use the Supabase API to update the user's password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('Erreur lors du changement de mot de passe:', error);
        toast({
          title: "Échec du changement de mot de passe",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }

      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été changé avec succès",
      });
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      userRole, 
      loading, 
      signIn, 
      signUp, 
      signOut,
      changePassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
