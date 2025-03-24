
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { BlogPostFormData } from '@/hooks/useBlogPosts';
import { Editor } from '@tinymce/tinymce-react';
import { useRef } from 'react';

interface PostContentEditorProps {
  form: UseFormReturn<BlogPostFormData>;
}

export function PostContentEditor({ form }: PostContentEditorProps) {
  const editorRef = useRef<any>(null);

  return (
    <FormField
      control={form.control}
      name="content"
      render={({ field }) => (
        <FormItem className="col-span-2">
          <FormLabel>Contenu</FormLabel>
          <FormControl>
            <Editor
              apiKey="no-api-key" // Replace with your TinyMCE API key for production
              onInit={(evt, editor) => editorRef.current = editor}
              initialValue={field.value}
              onEditorChange={(content) => {
                field.onChange(content);
              }}
              init={{
                height: 500,
                menubar: true,
                plugins: [
                  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                  'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                  'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount', 'emoticons'
                ],
                toolbar: 'undo redo | blocks | ' +
                  'bold italic forecolor backcolor | alignleft aligncenter ' +
                  'alignright alignjustify | bullist numlist outdent indent | ' +
                  'removeformat | link image media table | emoticons charmap | ' +
                  'fullscreen preview | help',
                content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px }',
                image_advtab: true,
                link_context_toolbar: true,
                convert_urls: false,
                branding: false,
                promotion: false
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
