
import React, { useState } from 'react';
import Header from '@/components/ui/layout/Header';
import { DownloadsTable, DownloadRequest } from '@/components/downloads/DownloadsTable';

// Données fictives pour l'exemple
const mockDownloads: DownloadRequest[] = [
  {
    id: '1',
    imageId: '101',
    imageSrc: 'https://www.stimergie.fr/photos/projet-corp/PNG/Une%20famille%20heureuse.png',
    imageTitle: 'Une famille heureuse',
    requestDate: '2025-04-01T14:30:00Z',
    downloadUrl: 'https://www.stimergie.fr/photos/projet-corp/Une%20famille%20heureuse.jpg',
    status: 'ready'
  },
  {
    id: '2',
    imageId: '102',
    imageSrc: 'https://www.stimergie.fr/photos/projet-corp/PNG/Famille%20sur%20une%20plage.png',
    imageTitle: 'Famille sur une plage',
    requestDate: '2025-04-03T09:15:00Z',
    downloadUrl: 'https://www.stimergie.fr/photos/projet-corp/Famille%20sur%20une%20plage.jpg',
    status: 'pending'
  },
  {
    id: '3',
    imageId: '103',
    imageSrc: 'https://www.stimergie.fr/photos/projet-corp/PNG/Réunion%20de%20travail.png',
    imageTitle: 'Réunion de travail',
    requestDate: '2025-03-25T11:45:00Z',
    downloadUrl: 'https://www.stimergie.fr/photos/projet-corp/Réunion%20de%20travail.jpg',
    status: 'ready'
  },
  {
    id: '4',
    imageId: '104',
    imageSrc: 'https://www.stimergie.fr/photos/projet-corp/PNG/Bureau%20moderne.png',
    imageTitle: 'Bureau moderne',
    requestDate: '2025-03-20T16:30:00Z',
    downloadUrl: 'https://www.stimergie.fr/photos/projet-corp/Bureau%20moderne.jpg',
    status: 'expired'
  },
  {
    id: '5',
    imageId: '105',
    imageSrc: 'https://www.stimergie.fr/photos/projet-corp/PNG/Paysage%20montagneux.png',
    imageTitle: 'Paysage montagneux',
    requestDate: '2025-04-05T10:20:00Z',
    downloadUrl: 'https://www.stimergie.fr/photos/projet-corp/Paysage%20montagneux.jpg',
    status: 'ready'
  }
];

const Downloads = () => {
  const [downloads] = useState<DownloadRequest[]>(mockDownloads);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Vos téléchargements HD</h1>
            <p className="text-muted-foreground mt-2">
              Retrouvez ici toutes vos demandes de téléchargements haute définition (&gt; 20 Mo).
            </p>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Historique des demandes</h2>
            <DownloadsTable downloads={downloads} />
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm">
              <strong>Note:</strong> Les liens de téléchargement sont disponibles pendant 7 jours après leur préparation. 
              La durée de préparation d'un fichier HD peut varier de quelques minutes à plusieurs heures selon la taille.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Downloads;
