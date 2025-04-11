
import React, { useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, AlertCircle, Clock, RefreshCw } from "lucide-react";
import { formatDate } from "@/utils/dateFormatting";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from '@/integrations/supabase/client';

export interface DownloadRequest {
  id: string;
  imageId: string;
  imageSrc: string;
  imageTitle: string;
  requestDate: string;
  downloadUrl: string;
  status: 'pending' | 'ready' | 'expired';
  isHD?: boolean;
}

interface DownloadsTableProps {
  downloads: DownloadRequest[];
  onRefresh?: () => void;
}

export const DownloadsTable = ({ downloads, onRefresh }: DownloadsTableProps) => {
  const [refreshingId, setRefreshingId] = React.useState<string | null>(null);
  
  useEffect(() => {
    const readyDownloadsWithoutUrl = downloads.filter(d => d.status === 'ready' && !d.downloadUrl);
    
    if (readyDownloadsWithoutUrl.length > 0) {
      console.log('Found ready downloads with missing URLs:', readyDownloadsWithoutUrl.length);
      // Only log this info, but don't automatically trigger a refresh
      // Let the user click the "Récupérer" button instead to avoid refresh loops
    }
  }, [downloads]);

  const handleDownload = (download: DownloadRequest) => {
    if (download.status !== 'ready') {
      return;
    }
    
    if (!download.downloadUrl) {
      console.error('Download URL is missing for ready download:', download.id);
      toast.error('URL de téléchargement manquante', {
        description: 'Le lien de téléchargement n\'est pas disponible. Veuillez actualiser la page ou réessayer plus tard.',
        action: {
          label: 'Actualiser',
          onClick: () => onRefresh && onRefresh()
        }
      });
      return;
    }
    
    try {
      toast.loading('Préparation du téléchargement...');
      
      window.open(download.downloadUrl, '_blank');
      
      toast.dismiss();
      toast.success('Téléchargement lancé');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.dismiss();
      toast.error('Échec du téléchargement', {
        description: 'Une erreur est survenue. Veuillez réessayer plus tard.',
        icon: <AlertCircle className="h-4 w-4" />
      });
    }
  };

  const handleRefresh = () => {
    if (onRefresh) {
      toast.loading('Actualisation des téléchargements...', { id: 'refresh-toast' });
      onRefresh();
      setTimeout(() => toast.dismiss('refresh-toast'), 1000);
    }
  };
  
  const handleRefreshDownload = async (download: DownloadRequest) => {
    if (refreshingId === download.id) return;
    
    try {
      setRefreshingId(download.id);
      toast.loading(`Tentative de récupération du téléchargement...`, { id: 'refresh-download' });
      
      const timestamp = download.requestDate.split('T')[0].replace(/-/g, '');
      const possiblePaths = [
        `public/${download.isHD ? 'hd-' : ''}images_${timestamp}*.zip`,
        `public/${download.isHD ? 'hd-' : ''}images_*.zip`
      ];
      
      let foundUrl = null;
      
      for (const searchPattern of possiblePaths) {
        const { data: files, error } = await supabase
          .storage
          .from('zip-downloads')
          .list('public', { 
            limit: 100,
            search: searchPattern.replace('*', '')
          });
        
        if (error) {
          console.error('Error searching for file:', error);
          continue;
        }
        
        if (files && files.length > 0) {
          const relevantFiles = files.filter(file => 
            file.created_at && new Date(file.created_at).toISOString().startsWith(download.requestDate.substring(0, 10))
          );
          
          if (relevantFiles.length > 0) {
            const file = relevantFiles[0];
            const { data: urlData, error: urlError } = await supabase
              .storage
              .from('zip-downloads')
              .createSignedUrl(`public/${file.name}`, 604800);
            
            if (!urlError && urlData?.signedUrl) {
              foundUrl = urlData.signedUrl;
              
              const { error: updateError } = await supabase
                .from('download_requests')
                .update({ download_url: foundUrl })
                .eq('id', download.id);
                
              if (updateError) {
                console.error('Error updating download record:', updateError);
              } else {
                console.log('Download record updated with URL');
                if (onRefresh) onRefresh();
              }
              
              break;
            }
          }
        }
      }
      
      toast.dismiss('refresh-download');
      
      if (foundUrl) {
        toast.success('URL de téléchargement récupérée', {
          description: 'Vous pouvez maintenant télécharger le fichier.',
          action: {
            label: 'Télécharger',
            onClick: () => window.open(foundUrl, '_blank')
          }
        });
      } else {
        toast.error('URL introuvable', {
          description: 'Impossible de trouver l\'URL de téléchargement. Veuillez réessayer plus tard.'
        });
      }
    } catch (error) {
      console.error('Error refreshing download:', error);
      toast.error('Erreur de récupération', {
        description: 'Une erreur est survenue lors de la tentative de récupération de l\'URL.'
      });
    } finally {
      setRefreshingId(null);
    }
  };
  
  const isDownloadHD = (download: DownloadRequest): boolean => {
    return download.isHD === true || download.imageTitle.toLowerCase().includes('hd');
  };

  return (
    <div className="w-full overflow-auto">
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>
      
      <Table>
        <TableCaption>Liste de vos demandes de téléchargements</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Date de demande</TableHead>
            <TableHead>Contenu</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {downloads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8">
                Aucune demande de téléchargement pour le moment
              </TableCell>
            </TableRow>
          ) : (
            downloads.map((download) => (
              <TableRow key={download.id}>
                <TableCell>{formatDate(download.requestDate)}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {download.imageTitle}
                  {isDownloadHD(download) && (
                    <Badge variant="outline" className="ml-2 bg-blue-50">HD</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {download.status === 'pending' && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 flex items-center gap-1 w-fit">
                      <Clock className="h-3 w-3" />
                      En cours de préparation
                    </Badge>
                  )}
                  {download.status === 'ready' && !download.downloadUrl && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 flex items-center gap-1 w-fit">
                      <AlertCircle className="h-3 w-3" />
                      URL manquante
                    </Badge>
                  )}
                  {download.status === 'ready' && download.downloadUrl && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                      Prêt à télécharger
                    </Badge>
                  )}
                  {download.status === 'expired' && (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                      Expiré
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {download.status === 'ready' && !download.downloadUrl ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="py-4"
                      onClick={() => handleRefreshDownload(download)}
                      disabled={refreshingId === download.id}
                    >
                      {refreshingId === download.id ? (
                        <LoadingSpinner className="h-4 w-4 mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Récupérer
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="py-4"
                      disabled={download.status !== 'ready' || !download.downloadUrl}
                      onClick={() => handleDownload(download)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
