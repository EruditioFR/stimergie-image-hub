
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { parseTagsString } from '@/utils/imageUtils';

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
            <TableHead>Client</TableHead>
            <TableHead>Dimensions</TableHead>
            <TableHead>Orientation</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Date d'ajout</TableHead>
          </TableRow>
        </TableHeader>
        <TooltipProvider delayDuration={300} skipDelayDuration={100}>
          <TableBody>
            {images.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-10">
                Aucune image disponible
              </TableCell>
            </TableRow>
          ) : (
            images.map((image) => {
              // Process tags to ensure we have an array
              let displayTags: string[] = [];
              if (image.tags) {
                if (typeof image.tags === 'string') {
                  displayTags = parseTagsString(image.tags);
                } else {
                  displayTags = image.tags;
                }
              }
              
              return (
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
                  <TableCell>{image.projets?.clients?.nom || 'N/A'}</TableCell>
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
                        {displayTags.length > 0 ? (
                          <>
                            {displayTags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                            {displayTags.length > 3 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex">
                                    <Badge variant="outline" className="text-xs cursor-help">
                                      +{displayTags.length - 3}
                                    </Badge>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <div className="flex flex-wrap gap-1">
                                    {displayTags.slice(3).map((tag, index) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        #{tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground text-xs">Aucun tag</span>
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
              );
            })
          )}
          </TableBody>
        </TooltipProvider>
      </Table>
    </div>
  );
}
