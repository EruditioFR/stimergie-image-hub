import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";
interface ClientImage {
  id: string;
  src: string;
  alt: string;
  title: string;
}
export function UserDashboard() {
  const {
    user,
    userRole
  } = useAuth();
  const {
    userProfile
  } = useUserProfile(user, "user");
  const [clientImages, setClientImages] = useState<ClientImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [clientNames, setClientNames] = useState<string[]>([]);

  // Fetch user's client IDs (multi-client support)
  useEffect(() => {
    async function fetchClientIds() {
      if (!user) return;
      try {
        // 1. Récupérer id_client ET client_ids depuis profiles
        const { data, error } = await supabase
          .from("profiles")
          .select("id_client, client_ids")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("❌ Erreur récupération client IDs:", error);
          return;
        }

        // 2. Construire la liste complète des IDs clients
        let allClientIds: string[] = [];
        
        if (data.client_ids && data.client_ids.length > 0) {
          // Multi-clients via client_ids
          allClientIds = data.client_ids;
        } else if (data.id_client) {
          // Mono-client via id_client
          allClientIds = [data.id_client];
        }

        if (allClientIds.length === 0) {
          console.log("⚠️ Aucun client associé");
          setLoading(false);
          return;
        }

        setClientIds(allClientIds);

        // 3. Récupérer les noms de TOUS les clients
        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select("nom")
          .in("id", allClientIds);

        if (clientsError) {
          console.error("❌ Erreur récupération noms clients:", clientsError);
        } else if (clientsData) {
          setClientNames(clientsData.map(c => c.nom));
        }
      } catch (error) {
        console.error("❌ Erreur inattendue:", error);
      }
    }
    fetchClientIds();
  }, [user, userProfile]);

  // Fetch images for ALL clients
  useEffect(() => {
    if (clientIds.length === 0) {
      setLoading(false);
      return;
    }
    async function fetchClientImages() {
      setLoading(true);
      try {
        // 1. Récupérer TOUS les projets de TOUS les clients
        const { data: projectsData, error: projectsError } = await supabase
          .from("projets")
          .select("id")
          .in("id_client", clientIds);
        
        if (projectsError) {
          console.error("❌ Erreur récupération projets:", projectsError);
          return;
        }
        
        const projectIds = projectsData.map(project => project.id);
        
        if (projectIds.length > 0) {
          // 2. Récupérer les 12 dernières images de TOUS les projets
          const { data: imagesData, error: imagesError } = await supabase
            .from("images")
            .select("id, title, url, url_miniature")
            .in("id_projet", projectIds)
            .order("created_at", { ascending: false })
            .limit(12);
          
          if (imagesError) {
            console.error("❌ Erreur récupération images:", imagesError);
            return;
          }
          
          const formattedImages = imagesData.map(img => ({
            id: img.id.toString(),
            src: img.url_miniature || img.url,
            alt: img.title,
            title: img.title
          }));
          
          setClientImages(formattedImages);
        } else {
          setClientImages([]);
        }
      } catch (error) {
        console.error("❌ Erreur inattendue:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchClientImages();
  }, [clientIds]);

  // Render loading state
  if (loading) {
    return <div className="space-y-8">
        <h2 className="text-3xl font-bold">
          Bienvenue {userProfile?.firstName} {userProfile?.lastName}
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => <div key={index} className="aspect-square bg-muted rounded animate-pulse"></div>)}
        </div>
      </div>;
  }
  return <div className="space-y-8">
      <h2 className="text-3xl font-bold">
        Bienvenue {userProfile?.firstName} {userProfile?.lastName}
      </h2>
      
      {clientNames.length > 0 && <div className="bg-muted p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">
            {clientNames.length === 1 
              ? `Entreprise: ${clientNames[0]}` 
              : `Entreprises: ${clientNames.join(", ")}`}
          </h3>
          <p className="text-muted-foreground">
            Vous avez accès aux ressources visuelles de {clientNames.length === 1 ? "votre entreprise" : "vos entreprises"}.
          </p>
        </div>}

      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">
      </h3>
        <Link to="/gallery" className="inline-flex items-center text-sm text-primary hover:underline">
          Voir toute la galerie
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 ml-1">
            <path fillRule="evenodd" d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>

      {clientIds.length === 0 ? <div className="text-center py-10">
          <h2 className="text-xl font-medium mb-4">Aucun client associé</h2>
          <p className="text-muted-foreground">
            Votre compte n'est pas associé à un client. Veuillez contacter l'administrateur.
          </p>
        </div> : clientImages.length > 0 ? <div className="relative py-6">
          <Carousel className="w-full" opts={{
        align: "start",
        loop: clientImages.length > 4,
        slidesToScroll: 1
      }}>
            <CarouselContent>
              {clientImages.map(image => <CarouselItem key={image.id} className="basis-full md:basis-1/2 lg:basis-1/3 xl:basis-1/4 p-2">
                  <Link to={`/image/${image.id}`} className="block h-full">
                    <div className="aspect-square overflow-hidden rounded-md border bg-muted hover:opacity-90 transition-opacity">
                      <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />
                    </div>
                    <p className="text-sm mt-1 truncate">{image.title}</p>
                  </Link>
                </CarouselItem>)}
            </CarouselContent>
            <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2" aria-label="Précédent" />
            <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2" aria-label="Suivant" />
          </Carousel>
        </div> : <p className="text-muted-foreground">Aucune image disponible pour le moment.</p>}

      {/* Afficher la section Fonctionnalités seulement pour les administrateurs */}
      {userRole === 'admin' && <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Fonctionnalités</h3>
          <div className="flex flex-wrap gap-4">
            <Link to="/gallery" className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90">
              Galerie d'images
            </Link>
            <Link to="/resources" className="inline-flex items-center rounded-md bg-muted px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted/90">
              Ressources
            </Link>
          </div>
        </div>}
    </div>;
}