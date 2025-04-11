
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ConnectionStatusAlertProps {
  status: 'connected' | 'connecting' | 'disconnected';
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function ConnectionStatusAlert({ status, onRefresh, isRefreshing }: ConnectionStatusAlertProps) {
  if (status === 'connected') return null;
  
  return (
    <Alert className="bg-amber-50">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>État de la connexion: {status === 'connecting' ? 'En cours de connexion' : 'Déconnecté'}</AlertTitle>
      <AlertDescription>
        {status === 'connecting' 
          ? 'Connexion à Supabase en cours. Les mises à jour en temps réel seront bientôt disponibles.'
          : 'La connexion temps réel est interrompue. Les mises à jour automatiques sont suspendues.'}
        <Button 
          variant="link" 
          onClick={onRefresh} 
          className="p-0 h-auto text-primary underline ml-2"
          disabled={isRefreshing}
        >
          Actualiser manuellement
        </Button>
      </AlertDescription>
    </Alert>
  );
}
