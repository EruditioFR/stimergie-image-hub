
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
              apiKey="quu1whftoq5rnpmordgzf3i052ljp6z1quwtsgt7o4f2k80h"
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
                  'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount', 'emoticons',
                  'hr', 'nonbreaking', 'pagebreak', 'paste', 'print', 'save', 'directionality',
                  'template', 'textpattern', 'toc', 'visualchars', 'codesample'
                ],
                toolbar1: 'undo redo | blocks | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist | link image',
                toolbar2: 'forecolor backcolor | formatselect | outdent indent | removeformat | help | fullscreen | preview | print | searchreplace | paste pastetext',
                toolbar3: 'insertdatetime | hr | table tabledelete tableprops tablerowprops tablecellprops | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol',
                toolbar4: 'charmap emoticons codesample | visualblocks visualchars | nonbreaking pagebreak | template | toc | directionality | media',
                toolbar_mode: 'sliding',
                content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px }',
                image_advtab: true,
                link_context_toolbar: true,
                convert_urls: false,
                branding: false,
                promotion: false,
                setup: function(editor) {
                  editor.ui.registry.addButton('customInsertButton', {
                    text: 'Insert Template',
                    onAction: function() {
                      editor.insertContent('<h2>New Template</h2><p>Start writing your content here...</p>');
                    }
                  });
                }
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
