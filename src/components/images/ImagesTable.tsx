
import { Image } from '@/utils/image/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ImagesTableProps {
  images: Image[];
}

export function ImagesTable({ images }: ImagesTableProps) {
  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Titre</TableHead>
            <TableHead>Dimensions</TableHead>
            <TableHead>Orientation</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Date d'ajout</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {images.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10">
                Aucune image disponible
              </TableCell>
            </TableRow>
          ) : (
            images.map((image) => (
              <TableRow key={image.id}>
                <TableCell>
                  <div className="h-16 w-16 relative overflow-hidden rounded">
                    <img 
                      src={image.display_url || image.src} 
                      alt={image.title} 
                      className="object-cover h-full w-full" 
                      loading="lazy"
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium">{image.title}</TableCell>
                <TableCell>{`${image.width} × ${image.height}`}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {image.orientation === 'landscape' ? 'Paysage' : 
                     image.orientation === 'square' ? 'Carré' : 
                     image.orientation}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {image.tags?.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {(image.tags?.length || 0) > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{(image.tags?.length || 0) - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(image.created_at || ''), { 
                    addSuffix: true,
                    locale: fr 
                  })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
