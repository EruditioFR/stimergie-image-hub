
import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DownloadRequest } from './DownloadsTable';

interface AdminDebugPanelProps {
  isAdmin: boolean;
  downloads: DownloadRequest[];
  realtimeStatus?: 'connected' | 'connecting' | 'disconnected';
}

export function AdminDebugPanel({ isAdmin, downloads, realtimeStatus }: AdminDebugPanelProps) {
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [functionLogs, setFunctionLogs] = useState<Record<string, string[]>>({});
  
  if (!isAdmin) return null;

  // Fonction pour afficher les logs des edge functions pour les admins
  const fetchEdgeFunctionLogs = async () => {
    try {
      // Pour les besoins de la démo, nous simulons les logs
      // Dans une vraie application, vous pourriez avoir un endpoint admin pour cela
      setFunctionLogs({
        'generate-zip': [
          '[INFO] Processing ZIP request',
          '[DEBUG] Downloading 5 images',
          '[INFO] ZIP created successfully',
          '[INFO] Uploading to storage bucket: ZIP Downloads'
        ],
        'check-download-url': [
          '[INFO] Checking for pattern: images_20250411',
          '[DEBUG] Found 3 matching files',
          '[INFO] Selected file: images_20250411_123456.zip'
        ]
      });
      
      toast.success('Logs récupérés', {
        description: 'Logs des fonctions Edge mis à jour'
      });
    } catch (error) {
      console.error('Error fetching function logs:', error);
      toast.error('Erreur lors de la récupération des logs');
    }
  };
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div 
        className="flex items-center justify-between cursor-pointer" 
        onClick={() => setShowDebugInfo(!showDebugInfo)}
      >
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-500" />
          <h3 className="font-medium">Informations de débogage (administrateur)</h3>
        </div>
        <Button variant="ghost" size="sm">
          {showDebugInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      
      {showDebugInfo && (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">État du système</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-white p-2 rounded">
                <span className="font-medium">Téléchargements:</span> {downloads.length}
              </div>
              <div className="bg-white p-2 rounded">
                <span className="font-medium">En attente:</span> {downloads.filter(d => d.status === 'pending').length}
              </div>
              <div className="bg-white p-2 rounded">
                <span className="font-medium">Prêts:</span> {downloads.filter(d => d.status === 'ready').length}
              </div>
              <div className="bg-white p-2 rounded">
                <span className="font-medium">Sans URL:</span> {
                  downloads.filter(d => d.status === 'ready' && !d.downloadUrl).length
                }
              </div>
              {realtimeStatus && (
                <div className="bg-white p-2 rounded col-span-2">
                  <span className="font-medium">Statut Realtime:</span>{" "}
                  <span className={`inline-flex items-center ${
                    realtimeStatus === 'connected' 
                      ? 'text-green-600' 
                      : realtimeStatus === 'connecting' 
                        ? 'text-amber-600' 
                        : 'text-red-600'
                  }`}>
                    {realtimeStatus === 'connected' 
                      ? 'Connecté' 
                      : realtimeStatus === 'connecting' 
                        ? 'Connexion en cours...' 
                        : 'Déconnecté'}
                    <span className={`ml-1.5 w-2 h-2 rounded-full ${
                      realtimeStatus === 'connected' 
                        ? 'bg-green-500' 
                        : realtimeStatus === 'connecting' 
                          ? 'bg-amber-500' 
                          : 'bg-red-500'
                    }`}></span>
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium">Logs des fonctions Edge</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchEdgeFunctionLogs}
                className="h-7 text-xs"
              >
                Récupérer les logs
              </Button>
            </div>
            
            {Object.keys(functionLogs).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(functionLogs).map(([funcName, logs]) => (
                  <div key={funcName} className="bg-white p-3 rounded border border-gray-200">
                    <h4 className="font-medium text-sm mb-1">{funcName}</h4>
                    <pre className="text-xs bg-gray-50 p-2 rounded max-h-32 overflow-auto">
                      {logs.join('\n')}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Cliquez sur "Récupérer les logs" pour afficher les informations des fonctions Edge</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
