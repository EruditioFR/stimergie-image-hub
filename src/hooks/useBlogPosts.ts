import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  client_id: string | null;
  client_name?: string | null;
  featured_image_url: string | null;
  content_type: 'Ressource' | 'Ensemble';
  created_at: string;
  updated_at: string;
  author_id: string;
  published: boolean;
  slug: string;
}

export interface BlogPostFormData {
  title: string;
  content: string;
  client_id: string | null;
  featured_image_url: string | null;
  content_type: 'Ressource' | 'Ensemble';
  published: boolean;
}

export function useBlogPosts(contentType?: 'Ressource' | 'Ensemble') {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['blog-posts', contentType],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select('*, clients(nom)')
        .order('created_at', { ascending: false });

      if (contentType) {
        query = query.eq('content_type', contentType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching blog posts:', error);
        throw new Error(error.message);
      }

      // Transform the data to match the BlogPost interface
      return data.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        client_id: post.client_id,
        client_name: post.clients?.nom || null,
        featured_image_url: post.featured_image_url,
        content_type: post.content_type || 'Ressource', // Default to 'Ressource' if not specified
        created_at: post.created_at,
        updated_at: post.updated_at,
        author_id: post.author_id,
        published: post.published,
        slug: post.slug
      })) as BlogPost[];
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData: BlogPostFormData) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from('blog_posts')
        .insert({
          ...postData,
          author_id: user.id,
          slug: '' // This will be filled by the trigger
        })
        .select();

      if (error) {
        console.error('Error creating blog post:', error);
        throw new Error(error.message);
      }

      return data[0];
    },
    onSuccess: () => {
      toast.success('Article créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
    onError: (error) => {
      toast.error(`Erreur lors de la création de l'article: ${error.message}`);
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ id, postData }: { id: string; postData: Partial<BlogPostFormData> }) => {
      const { data, error } = await supabase
        .from('blog_posts')
        .update(postData)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error updating blog post:', error);
        throw new Error(error.message);
      }

      return data[0];
    },
    onSuccess: () => {
      toast.success('Article mis à jour avec succès');
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
    onError: (error) => {
      toast.error(`Erreur lors de la mise à jour de l'article: ${error.message}`);
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting blog post:', error);
        throw new Error(error.message);
      }

      return id;
    },
    onSuccess: () => {
      toast.success('Article supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression de l'article: ${error.message}`);
    },
  });

  return {
    posts,
    isLoading,
    error,
    selectedPost,
    setSelectedPost,
    createPost: createPostMutation.mutate,
    updatePost: updatePostMutation.mutate,
    deletePost: deletePostMutation.mutate,
  };
}
