import { Header } from "@/components/ui/layout/Header";
import { Footer } from "@/components/ui/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ChangePasswordForm } from "@/components/users/ChangePasswordForm";
import { useAuth } from "@/context/AuthContext";
import { useUserProfile, formatRole } from "@/hooks/useUserProfile";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useState } from "react";

export default function Profile() {
  const { user, userRole } = useAuth();
  const { userProfile, loading } = useUserProfile(user, userRole);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Mon Profil</h1>
          
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Informations personnelles</TabsTrigger>
              <TabsTrigger value="security">Sécurité</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                  <CardDescription>
                    Gérez vos informations de profil
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userProfile && (
                    <ProfileForm 
                      user={user!}
                      userProfile={userProfile}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Sécurité</CardTitle>
                  <CardDescription>
                    Gérez votre mot de passe et vos paramètres de sécurité
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!showPasswordForm ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <h3 className="font-medium mb-2">Rôle</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatRole(userProfile?.role || 'user', userProfile?.clientName)}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowPasswordForm(true)}
                        className="text-sm text-primary hover:underline"
                      >
                        Changer mon mot de passe
                      </button>
                    </div>
                  ) : (
                    <ChangePasswordForm onCancel={() => setShowPasswordForm(false)} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
