
import React from 'react';
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
import { Download } from "lucide-react";
import { formatDate } from "@/utils/dateFormatting";
import { Badge } from "@/components/ui/badge";

export interface DownloadRequest {
  id: string;
  imageId: string;
  imageSrc: string;
  imageTitle: string;
  requestDate: string;
  downloadUrl: string;
  status: 'pending' | 'ready' | 'expired';
}

interface DownloadsTableProps {
  downloads: DownloadRequest[];
}

export const DownloadsTable = ({ downloads }: DownloadsTableProps) => {
  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableCaption>Liste de vos demandes de téléchargements HD</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Date de demande</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {downloads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8">
                Aucune demande de téléchargement HD pour le moment
              </TableCell>
            </TableRow>
          ) : (
            downloads.map((download) => (
              <TableRow key={download.id}>
                <TableCell>{formatDate(download.requestDate)}</TableCell>
                <TableCell>
                  {download.status === 'pending' && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                      En cours de préparation
                    </Badge>
                  )}
                  {download.status === 'ready' && (
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="py-4"
                    disabled={download.status !== 'ready'}
                    onClick={() => window.open(download.downloadUrl, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
