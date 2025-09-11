/**
 * Cache Monitoring Panel - Phase 4: Monitoring and Debug
 * Admin interface for cache diagnostics and management
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useCacheManagement, useCacheMonitoring } from '@/hooks/cache/useOptimizedCache';
import { Activity, Database, RefreshCw, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

export const CacheMonitoringPanel = () => {
  const { getCacheDiagnostics, emergencyClear, forceRefresh } = useCacheManagement();
  const { getHealthMetrics, isHealthy } = useCacheMonitoring();
  
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [healthMetrics, setHealthMetrics] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh diagnostics
  useEffect(() => {
    const refreshData = () => {
      try {
        const diag = getCacheDiagnostics();
        const health = getHealthMetrics();
        setDiagnostics(diag);
        setHealthMetrics(health);
      } catch (error) {
        console.error('Failed to refresh cache diagnostics:', error);
      }
    };

    refreshData();
    
    if (autoRefresh) {
      const interval = setInterval(refreshData, 5000); // Every 5 seconds
      return () => clearInterval(interval);
    }
  }, [getCacheDiagnostics, getHealthMetrics, autoRefresh]);

  const handleEmergencyClear = async () => {
    if (window.confirm('⚠️ This will clear all image caches. Continue?')) {
      setIsRefreshing(true);
      try {
        emergencyClear();
        setTimeout(() => {
          setIsRefreshing(false);
        }, 2000);
      } catch (error) {
        console.error('Emergency clear failed:', error);
        setIsRefreshing(false);
      }
    }
  };

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    try {
      await forceRefresh();
      setTimeout(() => {
        setIsRefreshing(false);
      }, 3000);
    } catch (error) {
      console.error('Force refresh failed:', error);
      setIsRefreshing(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getHealthStatus = () => {
    if (!healthMetrics) return { status: 'unknown', color: 'secondary' };
    
    const healthy = isHealthy();
    return {
      status: healthy ? 'healthy' : 'warning',
      color: healthy ? 'default' : 'destructive'
    };
  };

  if (!diagnostics || !healthMetrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Cache Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading diagnostics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const healthStatus = getHealthStatus();

  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Cache Health Status
            <Badge variant={healthStatus.color as any}>
              {healthStatus.status === 'healthy' ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <AlertTriangle className="h-3 w-3 mr-1" />
              )}
              {healthStatus.status.toUpperCase()}
            </Badge>
          </CardTitle>
          <CardDescription>
            Real-time cache performance and health metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Cache Hit Rate</div>
              <div className="text-2xl font-bold">{healthMetrics.cacheHitRate}%</div>
              <Progress value={healthMetrics.cacheHitRate} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Active Queries</div>
              <div className="text-2xl font-bold">{healthMetrics.totalQueries}</div>
              <div className="text-xs text-muted-foreground">
                {healthMetrics.loadingQueries} loading
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Memory Usage</div>
              <div className="text-2xl font-bold">{healthMetrics.memoryUsage}MB</div>
              <div className="text-xs text-muted-foreground">
                JS Heap
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Error Queries</div>
              <div className={`text-2xl font-bold ${healthMetrics.errorQueries > 0 ? 'text-destructive' : ''}`}>
                {healthMetrics.errorQueries}
              </div>
              <div className="text-xs text-muted-foreground">
                {healthMetrics.staleQueries} stale
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Diagnostics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Cache Diagnostics
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Pause' : 'Resume'} Auto-refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleForceRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEmergencyClear}
              disabled={isRefreshing}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Emergency Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="storage" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="storage">Storage Usage</TabsTrigger>
              <TabsTrigger value="queries">Query Analysis</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="storage" className="space-y-4">
              <div className="grid gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Session Storage</h3>
                    <span className="text-sm text-muted-foreground">
                      {formatBytes(diagnostics.storageUsage.session)}
                    </span>
                  </div>
                  <Progress 
                    value={(diagnostics.storageUsage.session / (5 * 1024 * 1024)) * 100} 
                    className="h-2"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    5MB limit (browser default)
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Local Storage</h3>
                    <span className="text-sm text-muted-foreground">
                      {formatBytes(diagnostics.storageUsage.local)}
                    </span>
                  </div>
                  <Progress 
                    value={(diagnostics.storageUsage.local / (10 * 1024 * 1024)) * 100} 
                    className="h-2"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    10MB limit (browser default)
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="queries" className="space-y-4">
              <div className="grid gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Query Breakdown</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Queries:</span>
                      <span>{diagnostics.totalQueries}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gallery Queries:</span>
                      <span>{diagnostics.galleryQueries}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Rate:</span>
                      <span>{Math.round((healthMetrics.successQueries / Math.max(healthMetrics.totalQueries, 1)) * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="performance" className="space-y-4">
              <div className="grid gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Performance Metrics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Memory Usage:</span>
                      <span>{formatBytes(diagnostics.memoryUsage)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cache Efficiency:</span>
                      <span className={healthMetrics.cacheHitRate > 70 ? 'text-green-600' : 'text-yellow-600'}>
                        {healthMetrics.cacheHitRate}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Error Rate:</span>
                      <span className={healthMetrics.errorQueries === 0 ? 'text-green-600' : 'text-red-600'}>
                        {Math.round((healthMetrics.errorQueries / Math.max(healthMetrics.totalQueries, 1)) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Cache Recommendations */}
      {healthMetrics.errorQueries > 5 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Performance Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              High error rate detected. Consider clearing cache or checking network connectivity.
            </p>
            <Button onClick={handleEmergencyClear} variant="destructive" size="sm">
              Clear Cache Now
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};