
import React from 'react';
import { AlertCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConnectionStatusAlertProps {
  realtimeStatus: 'connected' | 'connecting' | 'disconnected';
  className?: string;
  lastConnectedAt?: Date | null;
  reconnectAttempts?: number;
  onManualReconnect?: () => Promise<void>;
}

export function ConnectionStatusAlert({ 
  realtimeStatus, 
  className,
  lastConnectedAt,
  reconnectAttempts = 0,
  onManualReconnect
}: ConnectionStatusAlertProps) {
  // Render nothing if connected
  if (realtimeStatus === 'connected') {
    return null;
  }

  const isDisconnected = realtimeStatus === 'disconnected';
  
  return (
    <Alert 
      variant={isDisconnected ? "destructive" : "default"}
      className={cn(
        "transition-colors duration-500 mb-4", 
        {
          "animate-pulse": !isDisconnected
        },
        className
      )}
    >
      <div className="flex items-center gap-2">
        {isDisconnected ? (
          <WifiOff className="h-4 w-4" />
        ) : (
          <Wifi className="h-4 w-4" />
        )}
        <AlertTitle>
          {isDisconnected 
            ? "Connexion perdue" 
            : "Reconnexion en cours..."}
        </AlertTitle>
      </div>
      <AlertDescription className="mt-2">
        {isDisconnected ? (
          <span>
            La connexion au service de téléchargement a été perdue. 
            Vos requêtes seront traitées une fois la connexion rétablie.
            {reconnectAttempts > 0 && (
              <span className="block mt-1 text-xs">
                Tentatives de reconnexion: {reconnectAttempts}
              </span>
            )}
          </span>
        ) : (
          <span>
            Tentative de reconnexion au service de téléchargement...
            {lastConnectedAt && (
              <span className="block mt-1 text-xs">
                Dernière connexion: {lastConnectedAt.toLocaleTimeString()}
              </span>
            )}
          </span>
        )}
      </AlertDescription>
      
      {isDisconnected && onManualReconnect && (
        <div className="mt-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onManualReconnect}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Reconnexion manuelle
          </Button>
        </div>
      )}
    </Alert>
  );
}
