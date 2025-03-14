
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
      console.log("Initial session:", session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Get user role via RPC function
        fetchUserRoleViaRPC(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state change event:", event, "User ID:", session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Get user role via RPC when auth state changes
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
      console.log("Fetching user role for:", userId);
      // Use RPC to get role (security definer function)
      const { data, error } = await supabase.rpc('get_user_role');
      
      if (error) {
        console.error("Error fetching user role:", error);
        await fallbackFetchRole(userId);
        return;
      }
      
      console.log("User role from RPC:", data);
      if (data) {
        setUserRole(data);
      } else {
        await fallbackFetchRole(userId);
      }
    } catch (error) {
      console.error("Unexpected error fetching role:", error);
      await fallbackFetchRole(userId);
    } finally {
      setLoading(false);
    }
  };

  // Fallback method for retrieving role
  const fallbackFetchRole = async (userId: string) => {
    try {
      console.log("Using fallback method to fetch role for:", userId);
      
      // First try to get it from user metadata
      if (user?.user_metadata?.role) {
        console.log("Found role in user metadata:", user.user_metadata.role);
        setUserRole(user.user_metadata.role);
        return;
      }
      
      // Direct query as a last resort - may trigger RLS but wrapped in try/catch
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error("Error in fallback role fetch:", error);
        setUserRole('user'); // Default to user role
        return;
      }
      
      console.log("Role from direct query:", data?.role);
      setUserRole(data?.role || 'user');
    } catch (error) {
      console.error("Fallback role fetch failed:", error);
      setUserRole('user'); // Default to user role
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
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      // Include first_name and last_name in the user metadata
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: 'user' // Default role for new users
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
      // Check if we have a session before trying to sign out
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        // If no session exists, just clean up the local state without calling signOut
        console.log('No active session found, cleaning up local state only');
        setUser(null);
        setSession(null);
        setUserRole('user');
        
        toast({
          title: "Déconnecté avec succès",
        });
        return;
      }
      
      // If we have a session, proceed with sign out
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
      
      // Even if there's an error, clear the local state
      setUser(null);
      setSession(null);
      setUserRole('user');
      
      // Only throw if it's not an AuthSessionMissingError
      if (error instanceof Error && !error.message.includes('Auth session missing')) {
        throw error;
      }
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
