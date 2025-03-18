import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface ClientImage {
  id: string;
  src: string;
  alt: string;
  title: string;
}

export function UserDashboard() {
  const { user } = useAuth();
  const { userProfile } = useUserProfile(user, "user");
  const [clientImages, setClientImages] = useState<ClientImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>("");

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

  useEffect(() => {
    if (!clientId) return;

    async function fetchClientImages() {
      setLoading(true);
      try {
        const { data: projectsData, error: projectsError } = await supabase
          .from("projets")
          .select("id")
          .eq("id_client", clientId);

        if (projectsError) {
          console.error("Erreur lors de la récupération des projets:", projectsError);
          return;
        }

        const projectIds = projectsData.map(project => project.id);
        
        if (projectIds.length > 0) {
          const { data: imagesData, error: imagesError } = await supabase
            .from("images")
            .select("id, title, url, url_miniature")
            .in("id_projet", projectIds)
            .order("created_at", { ascending: false })
            .limit(12);

          if (imagesError) {
            console.error("Erreur lors de la récupération des images:", imagesError);
            return;
          }

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

    fetchClientImages();
  }, [clientId]);

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
      <h2 className="text-3xl font-bold">
        Bienvenue {userProfile?.firstName} {userProfile?.lastName}
      </h2>
      
      {clientName && (
        <div className="bg-muted p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Entreprise: {clientName}</h3>
          <p className="text-muted-foreground">
            Vous avez accès aux ressources visuelles de votre entreprise.
          </p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Vos images</h3>
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

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Fonctionnalités</h3>
        <div className="flex flex-wrap gap-4">
          <Link 
            to="/gallery" 
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90"
          >
            Galerie d'images
          </Link>
          <Link 
            to="/resources" 
            className="inline-flex items-center rounded-md bg-muted px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted/90"
          >
            Ressources
          </Link>
        </div>
      </div>
    </div>
  );
}
