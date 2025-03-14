
import { useEffect } from "react";
import { Hero } from "@/components/Hero";
import { Header } from "@/components/ui/layout/Header";
import { Footer } from "@/components/ui/layout/Footer";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { ClientAdminDashboard } from "@/components/dashboard/ClientAdminDashboard";
import { UserDashboard } from "@/components/dashboard/UserDashboard";
import { useAuth } from "@/context/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { dashboardType, loading: dataLoading } = useDashboardData();
  
  // Déterminer quel tableau de bord afficher
  const renderDashboard = () => {
    // Si l'utilisateur n'est pas connecté, afficher la page d'accueil standard
    if (!user) {
      return (
        <>
          <Hero />
          <section className="py-20 px-6">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold mb-12 text-center">
                Explorez nos collections d'images
              </h2>
              {/* Content will be added here */}
            </div>
          </section>
        </>
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
        return <Hero />;
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
