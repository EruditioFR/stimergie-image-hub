
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBlogPosts, BlogPost, BlogPostFormData } from '@/hooks/useBlogPosts';
import { useAuth } from '@/context/AuthContext';
import { useClients } from '@/hooks/useClients';
import { ImageSelector } from './ImageSelector';
import { AlertCircle, Eye, Save } from 'lucide-react';

interface BlogPostEditorProps {
  post?: BlogPost | null;
  onSave?: () => void;
}

export function BlogPostEditor({ post, onSave }: BlogPostEditorProps) {
  const { createPost, updatePost } = useBlogPosts();
  const { user } = useAuth();
  const { clients, loading } = useClients(); // Use 'loading' property instead of 'isLoading'
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(post?.featured_image_url || null);
  
  const form = useForm<BlogPostFormData>({
    defaultValues: {
      title: post?.title || '',
      content: post?.content || '',
      client_id: post?.client_id || null,
      featured_image_url: post?.featured_image_url || null,
      content_type: post?.content_type || 'Ressource',
      published: post?.published || false,
    },
  });

  useEffect(() => {
    if (post) {
      form.reset({
        title: post.title,
        content: post.content,
        client_id: post.client_id,
        featured_image_url: post.featured_image_url,
        content_type: post.content_type,
        published: post.published,
      });
      setSelectedImage(post.featured_image_url);
    }
  }, [post, form]);

  useEffect(() => {
    // Update the form value when the image changes
    form.setValue('featured_image_url', selectedImage);
  }, [selectedImage, form]);

  const handleSubmit = (data: BlogPostFormData) => {
    if (!user) {
      return;
    }

    if (post) {
      updatePost(
        { 
          id: post.id, 
          postData: { ...data, featured_image_url: selectedImage } 
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
        { ...data, featured_image_url: selectedImage },
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
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input placeholder="Titre de l'article" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de contenu</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Ressource">Ressource</SelectItem>
                      <SelectItem value="Ensemble">Ensemble</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client associé</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un client (optionnel)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Aucun client</SelectItem>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Associer cet article à un client (optionnel)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenu</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Contenu de l'article..." 
                      className="min-h-[200px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="featured_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image d'illustration</FormLabel>
                  <ImageSelector 
                    selectedImage={selectedImage}
                    onSelectImage={setSelectedImage}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="published"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Publier</FormLabel>
                    <FormDescription>
                      Cochez cette case pour rendre l'article visible publiquement
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

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
