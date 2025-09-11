/**
 * Gallery Debug Info Component
 * Provides comprehensive debug information for gallery issues
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Bug, Database, Globe, User, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface DebugInfo {
  user: {
    id: string;
    email: string;
    role: string;
    clientId: string;
  };
  environment: {
    domain: string;
    isDev: boolean;
    baseUrl: string;
  };
  projects: {
    accessibleProjects: string[];
    clientProjects: any[];
    projectDetails: any[];
  };
  images: {
    totalCount: number;
    accessibleImages: any[];
    firstImageUrls: string[];
    urlPattern: string;
  };
  database: {
    directQueries: any[];
    rlsPolicies: any[];
  };
}

export const GalleryDebugInfo = () => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const collectDebugInfo = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      console.log('🐛 Starting comprehensive debug info collection...');
      
      // 1. User Information
      const { data: userProfile } = await supabase
        .rpc('get_user_profile_data', { user_id: user.id });
      
      const { data: userRole } = await supabase.rpc('get_user_role');
      const { data: clientId } = await supabase.rpc('get_user_client_id', { user_id: user.id });

      // 2. Environment Information
      const environment = {
        domain: window.location.hostname,
        isDev: window.location.hostname !== 'stimergie.fr',
        baseUrl: window.location.origin
      };

      // 3. Projects Information
      const { data: accessibleProjects } = await supabase
        .rpc('get_accessible_projects', { 
          user_id: user.id, 
          check_time: new Date().toISOString() 
        });

      const { data: clientProjects } = await supabase
        .from('projets')
        .select('*')
        .eq('id_client', clientId);

      // Get project details for accessible projects
      const projectIds = accessibleProjects?.map(p => p.project_id) || [];
      const { data: projectDetails } = await supabase
        .from('projets')
        .select('*, clients(*)')
        .in('id', projectIds);

      // 4. Images Information
      const { count: totalImagesCount } = await supabase
        .from('images')
        .select('*', { count: 'exact', head: true });

      // Try to get images using accessible projects
      const { data: accessibleImages } = await supabase
        .from('images')
        .select('*, projets:id_projet(nom_projet, nom_dossier, clients:id_client(id, nom))')
        .in('id_projet', projectIds)
        .limit(5);

      // Get first few image URLs for URL pattern analysis
      const firstImageUrls = accessibleImages?.map(img => img.url) || [];
      const urlPattern = firstImageUrls.length > 0 ? 
        firstImageUrls[0].replace(/\/[^\/]+$/, '/[filename]') : 'No images found';

      // 5. Database Queries Debug
      const directQueries = [
        {
          name: 'Direct client projects query',
          query: `SELECT * FROM projets WHERE id_client = '${clientId}'`,
          result: clientProjects?.length || 0
        },
        {
          name: 'Accessible projects via RLS',
          query: `SELECT get_accessible_projects('${user.id}')`,
          result: accessibleProjects?.length || 0
        },
        {
          name: 'Images in accessible projects',
          query: `SELECT * FROM images WHERE id_projet IN (${projectIds.map(id => `'${id}'`).join(',')})`,
          result: accessibleImages?.length || 0
        }
      ];

      // 6. Check RLS Policies (skip as not accessible via client)
      const rlsPolicies = [
        { note: 'RLS policies cannot be queried directly via client for security reasons' }
      ];

      const debugData: DebugInfo = {
        user: {
          id: user.id,
          email: user.email || '',
          role: userRole || '',
          clientId: clientId || ''
        },
        environment,
        projects: {
          accessibleProjects: projectIds,
          clientProjects: clientProjects || [],
          projectDetails: projectDetails || []
        },
        images: {
          totalCount: totalImagesCount || 0,
          accessibleImages: accessibleImages || [],
          firstImageUrls,
          urlPattern
        },
        database: {
          directQueries,
          rlsPolicies: rlsPolicies || []
        }
      };

      setDebugInfo(debugData);
      console.log('🐛 Debug info collected:', debugData);

    } catch (error) {
      console.error('❌ Error collecting debug info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      collectDebugInfo();
    }
  }, [user]);

  if (!debugInfo) {
    return (
      <Card className="mb-6 border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Gallery Debug Information
          </CardTitle>
          <CardDescription>
            Collecting comprehensive debug information...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={collectDebugInfo} disabled={isLoading}>
            {isLoading ? 'Collecting...' : 'Collect Debug Info'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Gallery Debug Information
            <Badge variant="secondary">Live Debug</Badge>
          </CardTitle>
          <CardDescription>
            Comprehensive debug information for troubleshooting image visibility issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Information */}
          <Collapsible open={openSections.user} onOpenChange={() => toggleSection('user')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-0">
                {openSections.user ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <User className="h-4 w-4" />
                User Information
                <Badge variant={debugInfo.user.role === 'user' ? 'default' : 'destructive'}>
                  {debugInfo.user.role}
                </Badge>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 p-4 bg-white rounded-lg border">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>User ID:</strong> {debugInfo.user.id}</div>
                <div><strong>Email:</strong> {debugInfo.user.email}</div>
                <div><strong>Role:</strong> {debugInfo.user.role}</div>
                <div><strong>Client ID:</strong> {debugInfo.user.clientId}</div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Environment Information */}
          <Collapsible open={openSections.environment} onOpenChange={() => toggleSection('environment')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-0">
                {openSections.environment ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Globe className="h-4 w-4" />
                Environment Information
                <Badge variant={debugInfo.environment.isDev ? 'destructive' : 'default'}>
                  {debugInfo.environment.isDev ? 'DEV' : 'PROD'}
                </Badge>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 p-4 bg-white rounded-lg border">
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div><strong>Domain:</strong> {debugInfo.environment.domain}</div>
                <div><strong>Is Dev Environment:</strong> {debugInfo.environment.isDev ? 'YES' : 'NO'}</div>
                <div><strong>Base URL:</strong> {debugInfo.environment.baseUrl}</div>
                {debugInfo.environment.isDev && (
                  <div className="text-orange-600 font-medium">
                    ⚠️ Running on development environment - this might affect image URLs
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Projects Information */}
          <Collapsible open={openSections.projects} onOpenChange={() => toggleSection('projects')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-0">
                {openSections.projects ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Database className="h-4 w-4" />
                Projects Information
                <Badge variant={debugInfo.projects.accessibleProjects.length > 0 ? 'default' : 'destructive'}>
                  {debugInfo.projects.accessibleProjects.length} accessible
                </Badge>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 p-4 bg-white rounded-lg border">
              <div className="space-y-3 text-sm">
                <div>
                  <strong>Accessible Projects ({debugInfo.projects.accessibleProjects.length}):</strong>
                  <ul className="list-disc list-inside ml-4">
                    {debugInfo.projects.accessibleProjects.map(projectId => (
                      <li key={projectId} className="font-mono text-xs">{projectId}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <strong>Direct Client Projects ({debugInfo.projects.clientProjects.length}):</strong>
                  {debugInfo.projects.clientProjects.length === 0 ? (
                    <div className="text-red-600">❌ No projects found via direct client query</div>
                  ) : (
                    <ul className="list-disc list-inside ml-4">
                      {debugInfo.projects.clientProjects.map(project => (
                        <li key={project.id}>{project.nom_projet} ({project.id})</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <strong>Project Details:</strong>
                  {debugInfo.projects.projectDetails.map(project => (
                    <div key={project.id} className="ml-4 p-2 bg-gray-50 rounded">
                      <div><strong>Name:</strong> {project.nom_projet}</div>
                      <div><strong>Folder:</strong> {project.nom_dossier}</div>
                      <div><strong>Client:</strong> {project.clients?.nom}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Images Information */}
          <Collapsible open={openSections.images} onOpenChange={() => toggleSection('images')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-0">
                {openSections.images ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <ImageIcon className="h-4 w-4" />
                Images Information
                <Badge variant={debugInfo.images.accessibleImages.length > 0 ? 'default' : 'destructive'}>
                  {debugInfo.images.accessibleImages.length} found
                </Badge>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 p-4 bg-white rounded-lg border">
              <div className="space-y-3 text-sm">
                <div><strong>Total Images in DB:</strong> {debugInfo.images.totalCount}</div>
                <div><strong>Accessible Images:</strong> {debugInfo.images.accessibleImages.length}</div>
                <div><strong>URL Pattern:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{debugInfo.images.urlPattern}</code></div>
                
                {debugInfo.images.firstImageUrls.length > 0 && (
                  <div>
                    <strong>Sample Image URLs:</strong>
                    <ul className="list-disc list-inside ml-4">
                      {debugInfo.images.firstImageUrls.slice(0, 3).map((url, index) => (
                        <li key={index} className="font-mono text-xs break-all">{url}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {debugInfo.images.accessibleImages.length === 0 && (
                  <div className="text-red-600 font-medium">
                    ❌ No images found in accessible projects - this is the main issue!
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Database Queries */}
          <Collapsible open={openSections.database} onOpenChange={() => toggleSection('database')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-0">
                {openSections.database ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Database className="h-4 w-4" />
                Database Analysis
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 p-4 bg-white rounded-lg border">
              <div className="space-y-3 text-sm">
                <div>
                  <strong>Query Results:</strong>
                  {debugInfo.database.directQueries.map((query, index) => (
                    <div key={index} className="ml-4 p-2 bg-gray-50 rounded">
                      <div><strong>{query.name}:</strong> {query.result} results</div>
                      <code className="text-xs text-gray-600">{query.query}</code>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex gap-2">
            <Button onClick={collectDebugInfo} disabled={isLoading}>
              {isLoading ? 'Refreshing...' : 'Refresh Debug Info'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => console.log('Full Debug Info:', debugInfo)}
            >
              Log to Console
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};