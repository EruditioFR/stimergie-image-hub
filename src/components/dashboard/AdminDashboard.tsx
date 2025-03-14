
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, FolderKanban, ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";

export function AdminDashboard() {
  const [stats, setStats] = useState({
    clientsCount: 0,
    projectsCount: 0,
    imagesCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        // Fetch clients count
        const { count: clientsCount, error: clientsError } = await supabase
          .from("clients")
          .select("*", { count: "exact", head: true });

        // Fetch projects count
        const { count: projectsCount, error: projectsError } = await supabase
          .from("projets")
          .select("*", { count: "exact", head: true });

        // Fetch images count
        const { count: imagesCount, error: imagesError } = await supabase
          .from("images")
          .select("*", { count: "exact", head: true });

        if (clientsError || projectsError || imagesError) {
          console.error("Error fetching stats:", { clientsError, projectsError, imagesError });
        } else {
          setStats({
            clientsCount: clientsCount || 0,
            projectsCount: projectsCount || 0,
            imagesCount: imagesCount || 0
          });
        }
      } catch (error) {
        console.error("Unexpected error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold">Tableau de bord administrateur</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <UserPlus className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <div className="animate-pulse h-8 w-16 bg-muted rounded"></div> : stats.clientsCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Nombre total de clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Projets</CardTitle>
            <FolderKanban className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <div className="animate-pulse h-8 w-16 bg-muted rounded"></div> : stats.projectsCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Nombre total de projets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Images</CardTitle>
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <div className="animate-pulse h-8 w-16 bg-muted rounded"></div> : stats.imagesCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Nombre total d'images
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <h3 className="text-xl font-semibold mt-8 mb-4">Fonctionnalités</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/clients">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Clients</CardTitle>
              <CardDescription>
                Gérer les clients et leurs informations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ajouter, modifier ou supprimer des clients
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/projects">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Projets</CardTitle>
              <CardDescription>
                Gérer les projets de tous les clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Créer et gérer des projets pour chaque client
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/gallery">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Banque d'images</CardTitle>
              <CardDescription>
                Visualiser toutes les images
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Interface de visualisation des images
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/users">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Utilisateurs</CardTitle>
              <CardDescription>
                Gérer les comptes utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configurer les accès et les permissions
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/blog/new">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Blog</CardTitle>
              <CardDescription>
                Gérer les articles du blog
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Créer et publier des articles de blog
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
