
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDate } from '@/utils/dateFormatting';
import { supabase } from '@/integrations/supabase/client';
import { BlogPost } from '@/hooks/useBlogPosts';
import { AlertCircle, ArrowLeft, Edit } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getDropboxDownloadUrl } from '@/utils/image/urlUtils';

export function BlogPostView() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, userRole } = useAuth();

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*, clients(nom), dropbox_image_url, url_miniature')
          .eq('slug', slug)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error('Article non trouvé');
        }

        const blogPost: BlogPost = {
          id: data.id,
          title: data.title,
          content: data.content,
          client_id: data.client_id || null,
          client_name: data.clients?.nom || null,
          featured_image_url: data.featured_image_url || null,
          dropbox_image_url: data.dropbox_image_url || null,
          url_miniature: data.url_miniature || null,
          content_type: (data.content_type as 'Ressource' | 'Ensemble') || 'Ressource',
          category: data.category as 'Actualités' | 'Projets' | 'Conseils' | null,
          created_at: data.created_at,
          updated_at: data.updated_at,
          author_id: data.author_id,
          published: data.published,
          slug: data.slug
        };
        setPost(blogPost);

      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Une erreur est survenue lors du chargement de l\'article');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  const canEdit = user && ['admin', 'admin_client'].includes(userRole);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-3/4 mb-6" />
        <div className="h-80 bg-gray-200 rounded mb-6" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-full" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <Alert variant="destructive" className="max-w-4xl mx-auto my-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error || 'Article non trouvé'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={() => navigate(post?.content_type === 'Ressource' ? '/resources' : '/ensemble')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux {post?.content_type === 'Ressource' ? 'ressources' : 'articles'}
        </Button>
        
        <h1 className="text-xl font-medium">
          {post?.content_type === 'Ressource' ? 'Article Ressource' : 'Article Ensemble'}
        </h1>
      </div>

      <Card>
        {(post?.featured_image_url || post?.dropbox_image_url || post?.url_miniature) && (
          <div 
            className="w-full h-64 md:h-80 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${
                post.url_miniature 
                  ? getDropboxDownloadUrl(post.url_miniature)
                  : post.dropbox_image_url 
                    ? getDropboxDownloadUrl(post.dropbox_image_url)
                    : post.featured_image_url
              })`
            }}
          />
        )}

        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl md:text-3xl">{post?.title}</CardTitle>
              <p className="text-muted-foreground mt-2">
                Publié le {post ? formatDate(post.created_at) : ''}
                {post?.client_name && ` · Client: ${post.client_name}`}
                {post?.category && post.content_type === 'Ensemble' && ` · Catégorie: ${post.category}`}
              </p>
            </div>

            {post && !post.published && (
              <span className="text-sm font-medium px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">
                Brouillon
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="prose prose-lg max-w-none">
            {post?.content.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </CardContent>

        {user && ['admin', 'admin_client'].includes(userRole) && post && (
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={() => navigate(`/blog/edit/${post.id}`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Modifier l'article
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

