
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';
import { BlogPostFormData } from '@/hooks/useBlogPosts';

interface PostContentEditorProps {
  form: UseFormReturn<BlogPostFormData>;
}

export function PostContentEditor({ form }: PostContentEditorProps) {
  return (
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
  );
}
