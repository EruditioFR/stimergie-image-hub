import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { BlogPostFormData } from '@/hooks/useBlogPosts';
import { RichTextEditor } from '@/components/ui/rich-text-editor/RichTextEditor';

interface PostContentEditorProps {
  form: UseFormReturn<BlogPostFormData>;
}

export function PostContentEditor({ form }: PostContentEditorProps) {
  return (
    <FormField
      control={form.control}
      name="content"
      render={({ field }) => (
        <FormItem className="col-span-2">
          <FormLabel>Contenu</FormLabel>
          <FormControl>
            <RichTextEditor
              value={field.value}
              onChange={field.onChange}
              placeholder="Écrivez le contenu de votre article ici..."
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
