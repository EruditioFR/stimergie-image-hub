
import { Button } from "@/components/ui/button";
import { Album, FolderX } from "lucide-react";
import { Link } from "react-router-dom";

export function EmptyAlbums() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex items-center justify-center h-20 w-20 rounded-full bg-muted mb-6">
        <FolderX className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Aucun album partagé</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        Vous n'avez pas encore d'albums partagés. Les albums que vous créez ou qui vous sont partagés apparaîtront ici.
      </p>
      <Link to="/gallery">
        <Button className="flex items-center gap-2">
          <Album className="h-4 w-4" />
          Aller à la galerie
        </Button>
      </Link>
    </div>
  );
}
