
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBlogPosts, BlogPost, BlogPostFormData } from '@/hooks/useBlogPosts';
import { useAuth } from '@/context/AuthContext';
import { useClients } from '@/hooks/useClients';
import { AlertCircle, Eye, Save } from 'lucide-react';
import { PostMetadataFields } from './PostMetadataFields';
import { PostContentEditor } from './PostContentEditor';
import { PostFeaturedImage } from './PostFeaturedImage';
import { PostPublishToggle } from './PostPublishToggle';

interface BlogPostEditorProps {
  post?: BlogPost | null;
  onSave?: () => void;
}

export function BlogPostEditor({ post, onSave }: BlogPostEditorProps) {
  const { createPost, updatePost } = useBlogPosts();
  const { user } = useAuth();
  const { clients, loading } = useClients();
  const navigate = useNavigate();
  
  const form = useForm<BlogPostFormData>({
    defaultValues: {
      title: post?.title || '',
      content: post?.content || '',
      client_id: post?.client_id || null,
      featured_image_url: post?.featured_image_url || null,
      content_type: post?.content_type || 'Ressource',
      category: post?.category || null,
      published: post?.published || false,
    },
  });

  // Track content type to conditionally show category field
  const [contentType, setContentType] = useState<'Ressource' | 'Ensemble'>(
    post?.content_type || 'Ressource'
  );

  // Watch for content type changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'content_type') {
        setContentType(value.content_type as 'Ressource' | 'Ensemble');
        
        // Reset category when switching from Ensemble to Ressource
        if (value.content_type === 'Ressource') {
          form.setValue('category', null);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    if (post) {
      form.reset({
        title: post.title,
        content: post.content,
        client_id: post.client_id,
        featured_image_url: post.featured_image_url,
        content_type: post.content_type,
        category: post.category,
        published: post.published,
      });
      setContentType(post.content_type);
    }
  }, [post, form]);

  const handleSubmit = (data: BlogPostFormData) => {
    if (!user) {
      return;
    }

    // Convertir la valeur "null" (string) en null (valeur)
    const processedData = {
      ...data,
      client_id: data.client_id === "null" ? null : data.client_id
    };

    if (post) {
      updatePost(
        { 
          id: post.id, 
          postData: processedData
        }, 
        {
          onSuccess: () => {
            if (onSave) onSave();
            navigate(data.content_type === 'Ressource' ? '/resources' : '/ensemble');
          }
        }
      );
    } else {
      createPost(
        processedData,
        {
          onSuccess: () => {
            if (onSave) onSave();
            navigate(data.content_type === 'Ressource' ? '/resources' : '/ensemble');
          }
        }
      );
    }
  };

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Vous devez être connecté pour créer ou modifier un article.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{post ? 'Modifier l\'article' : 'Nouvel article'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <PostMetadataFields 
              form={form} 
              clients={clients} 
              contentType={contentType}
            />
            
            <PostContentEditor form={form} />
            
            <PostFeaturedImage 
              form={form} 
              initialImage={post?.featured_image_url || null} 
            />
            
            <PostPublishToggle form={form} />

            <CardFooter className="flex justify-between px-0">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Annuler
              </Button>
              <div className="space-x-2">
                <Button 
                  type="submit" 
                  variant="default"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </Button>
                {post && (
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Prévisualiser
                  </Button>
                )}
              </div>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
