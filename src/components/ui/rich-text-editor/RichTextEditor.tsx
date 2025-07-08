
import React, { useRef, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<any>(null);

  return (
    <div className={className}>
      <Editor
        apiKey="quu1whftoq5rnpmordgzf3i052ljp6z1quwtsgt7o4f2k80h"
        onInit={(evt, editor) => editorRef.current = editor}
        initialValue={value}
        onEditorChange={(content) => {
          onChange(content);
        }}
        init={{
          height: 500,
          menubar: true,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'table', 'code', 'help', 'wordcount',
            'hr', 'nonbreaking', 'paste', 'print', 'save',
            'template', 'textpattern', 'visualchars'
          ],
          toolbar1: 'undo redo | blocks | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify',
          toolbar2: 'bullist numlist | outdent indent | removeformat | help | fullscreen | preview | print | searchreplace',
          toolbar3: 'forecolor backcolor | formatselect | hr | table tabledelete tableprops tablerowprops tablecellprops',
          toolbar4: 'tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol',
          toolbar_mode: 'sliding',
          content_style: `
            body { 
              font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; 
              font-size: 14px;
              line-height: 1.6;
            }
            h1 { font-size: 2.5em; font-weight: bold; margin: 1em 0 0.5em 0; }
            h2 { font-size: 2em; font-weight: bold; margin: 1.5em 0 0.75em 0; }
            h3 { font-size: 1.5em; font-weight: bold; margin: 1.25em 0 0.625em 0; }
            h4 { font-size: 1.25em; font-weight: bold; margin: 1em 0 0.5em 0; }
            p { margin: 0 0 1em 0; }
            ul, ol { margin: 0 0 1em 1.5em; }
            li { margin: 0 0 0.5em 0; }
          `,
          branding: false,
          promotion: false,
          placeholder: placeholder,
          setup: function(editor) {
            // Configuration additionnelle si nécessaire
            editor.on('focus', function() {
              editor.getContainer().style.borderColor = 'hsl(var(--ring))';
            });
            editor.on('blur', function() {
              editor.getContainer().style.borderColor = 'hsl(var(--border))';
            });
          }
        }}
      />
    </div>
  );
}
