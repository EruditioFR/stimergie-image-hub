
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { BlogPostEditor } from '@/components/blog/BlogPostEditor';
import { supabase } from '@/integrations/supabase/client';
import { BlogPost } from '@/hooks/useBlogPosts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function BlogEditor() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select(`
            id, 
            title, 
            content, 
            client_id, 
            clients(nom), 
            featured_image_url, 
            content_type, 
            created_at, 
            updated_at, 
            author_id, 
            published, 
            slug
          `)
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        setPost({
          ...data,
          client_name: data.clients?.nom || null,
        });
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Une erreur est survenue lors du chargement de l\'article');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/4 mb-6" />
        <div className="h-screen/2 bg-gray-200 rounded" />
      </div>
    );
  }

  if (id && error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <BlogPostEditor post={post} />
    </div>
  );
}
