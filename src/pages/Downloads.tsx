
import React, { useState, useEffect } from 'react';
import Header from '@/components/ui/layout/Header';
import { useDownloads } from '@/hooks/useDownloads';
import { Footer } from '@/components/ui/layout/Footer';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useRealtimeStatus } from '@/hooks/useRealtimeStatus';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { DownloadsHeader } from '@/components/downloads/DownloadsHeader';
import { ConnectionStatusAlert } from '@/components/downloads/ConnectionStatusAlert';
import { AdminDebugPanel } from '@/components/downloads/AdminDebugPanel';
import { DownloadsContent } from '@/components/downloads/DownloadsContent';
import { DownloadsFooter } from '@/components/downloads/DownloadsFooter';

const Downloads = () => {
  const { downloads, isLoading, error, refreshDownloads } = useDownloads();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialRefreshDone, setInitialRefreshDone] = useState(false);
  const { user } = useAuth();
  const { realtimeStatus, lastConnectedAt, reconnectAttempts } = useRealtimeStatus();
  const { isAdmin } = useAdminStatus(user);
  
  // Force a refresh when the component mounts - but only once
  useEffect(() => {
    if (!initialRefreshDone && !isLoading) {
      console.log('Performing initial refresh on Downloads page mount');
      refreshDownloads();
      setInitialRefreshDone(true);
    }
  }, [refreshDownloads, initialRefreshDone, isLoading]);

  // Debug logging - reducing frequency by only logging when downloads change
  useEffect(() => {
    if (downloads.length > 0 && !isLoading) {
      console.log('Downloads ready to render:', downloads.length);
    }
  }, [downloads, isLoading]);

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    toast.info('Actualisation des téléchargements...', { id: 'refresh-toast' });
    
    try {
      await refreshDownloads();
      toast.dismiss('refresh-toast');
      toast.success('Téléchargements actualisés');
    } catch (err) {
      toast.dismiss('refresh-toast');
      toast.error('Erreur lors de l\'actualisation');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col space-y-8">
          <DownloadsHeader 
            onRefresh={handleManualRefresh}
            isRefreshing={isRefreshing}
          />

          <ConnectionStatusAlert 
            realtimeStatus={realtimeStatus}
            lastConnectedAt={lastConnectedAt}
            reconnectAttempts={reconnectAttempts}
          />

          <AdminDebugPanel 
            isAdmin={isAdmin}
            downloads={downloads}
          />

          <DownloadsContent 
            isLoading={isLoading}
            error={error}
            downloads={downloads}
            onRefresh={handleManualRefresh}
            isRefreshing={isRefreshing}
          />

          <DownloadsFooter />
        </div>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
};

export default Downloads;
