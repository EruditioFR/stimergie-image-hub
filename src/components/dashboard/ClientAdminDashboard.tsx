
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageIcon, FolderKanban, FileEdit } from "lucide-react";
import { Link } from "react-router-dom";
import { ImageGallery } from "@/components/ImageGallery";

interface ClientImage {
  id: string;
  src: string;
  alt: string;
  title: string;
}

export function ClientAdminDashboard() {
  const { user } = useAuth();
  const userProfile = useUserProfile(user, "admin_client");
  const [clientImages, setClientImages] = useState<ClientImage[]>([]);
  const [stats, setStats] = useState({
    projectsCount: 0,
    imagesCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>("");

  // Récupérer l'ID du client associé à l'utilisateur
  useEffect(() => {
    async function fetchClientId() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id_client")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Erreur lors de la récupération de l'ID client:", error);
          return;
        }

        if (data?.id_client) {
          setClientId(data.id_client);
          
          // Fetch client name
          const { data: clientData, error: clientError } = await supabase
            .from("clients")
            .select("nom")
            .eq("id", data.id_client)
            .single();
            
          if (clientError) {
            console.error("Erreur lors de la récupération du nom du client:", clientError);
          } else if (clientData) {
            setClientName(clientData.nom);
          }
        }
      } catch (error) {
        console.error("Erreur inattendue:", error);
      }
    }

    fetchClientId();
  }, [user]);

  // Récupérer les statistiques et les images du client
  useEffect(() => {
    if (!clientId) return;

    async function fetchClientData() {
      setLoading(true);
      try {
        // 1. Récupérer les ID des projets associés à ce client
        const { data: projectsData, error: projectsError } = await supabase
          .from("projets")
          .select("id")
          .eq("id_client", clientId);

        if (projectsError) {
          console.error("Erreur lors de la récupération des projets:", projectsError);
          return;
        }

        const projectIds = projectsData.map(project => project.id);
        
        // 2. Récupérer les statistiques
        setStats({
          projectsCount: projectIds.length,
          imagesCount: 0 // On va le mettre à jour après avoir récupéré les images
        });

        // 3. Récupérer les images associées aux projets
        if (projectIds.length > 0) {
          const { data: imagesData, error: imagesError } = await supabase
            .from("images")
            .select("id, title, url, url_miniature")
            .in("id_projet", projectIds)
            .limit(20);

          if (imagesError) {
            console.error("Erreur lors de la récupération des images:", imagesError);
            return;
          }

          // 4. Calculer le nombre total d'images
          const { count: imagesCount, error: countError } = await supabase
            .from("images")
            .select("id", { count: "exact", head: true })
            .in("id_projet", projectIds);

          if (countError) {
            console.error("Erreur lors du comptage des images:", countError);
          } else {
            setStats(prev => ({
              ...prev,
              imagesCount: imagesCount || 0
            }));
          }

          // 5. Formater les images pour l'affichage
          const formattedImages = imagesData.map(img => ({
            id: img.id.toString(),
            src: img.url_miniature || img.url,
            alt: img.title,
            title: img.title
          }));

          setClientImages(formattedImages);
        }
      } catch (error) {
        console.error("Erreur inattendue:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchClientData();
  }, [clientId]);

  // Si aucun ID client n'est trouvé
  if (!loading && !clientId) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-4">Aucun client associé</h2>
        <p className="text-muted-foreground">
          Votre compte n'est pas associé à un client. Veuillez contacter l'administrateur.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">
          Tableau de bord {userProfile?.firstName} {userProfile?.lastName}
        </h2>
        {clientName && (
          <h3 className="text-2xl font-bold mt-2" style={{ color: "#055e4c" }}>
            {clientName}
          </h3>
        )}
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              Nombre de projets
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
              Nombre d'images disponibles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <h3 className="text-xl font-semibold mt-8 mb-4">Fonctionnalités</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/projects">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Projets</CardTitle>
              <CardDescription>
                Visualiser vos projets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Accéder aux détails de vos projets
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/gallery">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Galerie</CardTitle>
              <CardDescription>
                Visualiser vos images
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Parcourir vos images par projet
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/blog/new">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Blog</CardTitle>
              <CardDescription>
                Gérer vos articles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Créer et publier des articles
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Gallery Preview */}
      <h3 className="text-xl font-semibold mt-8 mb-4">Vos dernières images</h3>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="aspect-square bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      ) : clientImages.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {clientImages.map(image => (
            <Link to={`/image/${image.id}`} key={image.id} className="block">
              <div className="aspect-square overflow-hidden rounded-md border bg-muted hover:opacity-90 transition-opacity">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="text-sm mt-1 truncate">{image.title}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Aucune image disponible pour le moment.</p>
      )}
      
      <div className="mt-4 text-center">
        <Link 
          to="/gallery" 
          className="inline-flex items-center text-sm text-primary hover:underline"
        >
          Voir toute la galerie
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 ml-1">
            <path fillRule="evenodd" d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
