import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BlogPost, useBlogPosts } from '@/hooks/useBlogPosts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/utils/dateFormatting';
import { Edit, Eye, Plus, Trash2 } from 'lucide-react';
import { ClientsFilter } from '@/components/gallery/ClientsFilter';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { generateDisplayImageUrl } from '@/utils/image/imageUrlGenerator';

interface BlogPostListProps {
  contentType?: 'Ressource' | 'Ensemble';
  title?: string;
  description?: string;
}

export function BlogPostList({ contentType, title, description }: BlogPostListProps) {
  const { posts, isLoading, error, deletePost } = useBlogPosts(contentType);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [userClientId, setUserClientId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUserClientId = async () => {
      if (userRole === 'admin_client' && user) {
        try {
          const { data, error } = await supabase.rpc('get_user_client_id', {
            user_id: user.id
          });
          
          if (error) {
            console.error('Error fetching user client ID:', error);
            return;
          }
          
          setUserClientId(data);
          setSelectedClient(data);
          console.log('Admin client user client ID fetched:', data);
        } catch (error) {
          console.error('Error in fetchUserClientId:', error);
        }
      }
    };
    
    fetchUserClientId();
  }, [user, userRole]);
  
  const filteredPosts = posts?.filter(post => {
    if (userRole === 'admin_client' && userClientId) {
      return post.client_id === userClientId;
    } else if (selectedClient) {
      return post.client_id === selectedClient;
    }
    return true;
  });

  const handleDelete = (post: BlogPost) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'article "${post.title}" ?`)) {
      deletePost(post.id);
    }
  };

  const getImageUrl = (post: BlogPost) => {
    if (post.client_name && post.title) {
      return generateDisplayImageUrl(post.client_name, post.title);
    }
    
    return post.featured_image_url || post.url_miniature || '';
  };

  const canEdit = user && ['admin', 'admin_client'].includes(userRole);
  
  const canChangeClientFilter = userRole !== 'admin_client';

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Une erreur est survenue lors du chargement des articles.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          {title && <h1 className="text-3xl font-bold">{title}</h1>}
          {description && <p className="text-muted-foreground mt-1">{description}</p>}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {userRole === 'admin' && (
            <ClientsFilter 
              selectedClient={selectedClient}
              onClientChange={setSelectedClient}
              className="w-full sm:w-auto"
              userRole={userRole}
              userClientId={userClientId}
            />
          )}
          
          {canEdit && (
            <Button onClick={() => navigate('/blog/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvel article
            </Button>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <div></div>
      ) : filteredPosts?.length === 0 ? (
        <div></div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts?.map((post) => (
            <Card key={post.id} className="overflow-hidden flex flex-col">
              {getImageUrl(post) && (
                <div 
                  className="h-48 bg-cover bg-center" 
                  style={{ 
                    backgroundImage: `url(${getImageUrl(post)})` 
                  }}
                />
              )}
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                    {post.client_name && (
                      <CardDescription>Client: {post.client_name}</CardDescription>
                    )}
                  </div>
                  {!post.published && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                      Brouillon
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground text-sm mb-2">
                  {formatDate(post.created_at)}
                </p>
                <p className="line-clamp-3">
                  {post.content}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/blog/${post.slug}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Voir
                </Button>
                
                {canEdit && (
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/blog/edit/${post.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(post)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
