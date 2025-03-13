
import { FormField, FormItem, FormControl, FormLabel, FormDescription } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { BlogPostFormData } from '@/hooks/useBlogPosts';

interface PostPublishToggleProps {
  form: UseFormReturn<BlogPostFormData>;
}

export function PostPublishToggle({ form }: PostPublishToggleProps) {
  return (
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
  );
}
