
import { formatDate } from "@/utils/dateFormatting";
import { Album } from "@/pages/SharedAlbums";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ExternalLink, Images, User } from "lucide-react";
import { Link } from "react-router-dom";

interface AlbumsListProps {
  albums: Album[];
}

export function AlbumsList({ albums }: AlbumsListProps) {
  const isActive = (fromDate: string, untilDate: string) => {
    const now = new Date();
    const from = new Date(fromDate);
    const until = new Date(untilDate);
    return now >= from && now <= until;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {albums.map(album => (
        <Card key={album.id} className="flex flex-col h-full">
          <CardHeader>
            <div className="flex justify-between items-start mb-2">
              <Badge variant={isActive(album.access_from, album.access_until) ? "success" : "destructive"} className="mb-2">
                {isActive(album.access_from, album.access_until) ? "Actif" : "Expiré"}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Images className="h-3 w-3" />
                {album.image_count}
              </Badge>
            </div>
            <CardTitle className="line-clamp-1">{album.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {album.description || "Aucune description"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Créé par:</span>
                <span>{album.created_by_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Disponible du:</span>
                <span>{formatDate(album.access_from)} au {formatDate(album.access_until)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Créé le:</span>
                <span>{formatDate(album.created_at)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Link to={`/shared-album/${album.share_key}`} className="w-full">
              <Button variant="default" className="w-full flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Voir l'album
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
